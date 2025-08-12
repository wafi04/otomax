import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { GetProductFromDigiflazz } from 'src/lib/digiflazz/digiflazz.dto';
import { DigiflazzService } from 'src/lib/digiflazz/digiflazz.service';
import { PrismaService } from 'src/lib/prisma/prisma.service';

@Injectable()
export class ProviderRepository {
  constructor(
    private prisma: PrismaService,
    private digiflazzService: DigiflazzService,
  ) {}

  async syncAllProviders() {
    const results = await Promise.allSettled([
      this.syncDigiflazz(),
      // this.syncIAK(),
      // this.syncOtherProvider(),
    ]);

    return results.map((result, index) => ({
      provider: ['digiflazz'][index], // Add more providers as needed
      status: result.status,
      data: result.status === 'fulfilled' ? result.value : result.reason,
    }));
  }

  private async syncDigiflazz() {
    try {
      const data = await this.digiflazzService.checkPrice();
      return this.processBatchData(data.data, 'digiflazz');
    } catch (error) {
      console.error('Digiflazz sync error:', error);
      throw error;
    }
  }

  private async processBatchData(
    dataArray: GetProductFromDigiflazz[],
    provider: string,
  ) {
    // 1. Get existing data with better query structure
    const [categories, existingServices, existingMappings, customerGroups] =
      await Promise.all([
        this.prisma.$queryRaw<{ id: number; brand: string }[]>`
          SELECT id, brand FROM categories WHERE status = 'active'
        `,
        this.prisma.$queryRaw<
          { id: number; name: string; providerId: string }[]
        >`
          SELECT s.id, s.name, spm.provider_id
        FROM services s 
        JOIN service_provider_mappings spm ON s.id = spm.service_id
          WHERE spm.provider = ${provider} AND spm.is_active = 'active'
        `,
        this.prisma.$queryRaw<{ service_id: number; provider_id: string }[]>`
          SELECT service_id, provider_id FROM service_provider_mappings 
          WHERE provider = ${provider}
        `,
        this.prisma.$queryRaw<{ id: number; name: string }[]>`
          SELECT id, name FROM customer_groups 
          WHERE name IN ('user', 'reseller', 'platinum')
        `,
      ]);

    // 2. Create optimized lookup maps
    const categoryMap = new Map<string, { id: number; brand: string }>();
    const serviceMap = new Map<string, { id: number; name: string }>();
    const mappingMap = new Map<string, { service_id: number }>();
    const customerGroupMap = new Map<string, number>();

    categories.forEach((cat) => categoryMap.set(cat.brand.toUpperCase(), cat));
    existingServices.forEach((svc) => serviceMap.set(svc.providerId, svc));
    existingMappings.forEach((map) =>
      mappingMap.set(map.provider_id, { service_id: map.service_id }),
    );
    customerGroups.forEach((group) =>
      customerGroupMap.set(group.name, group.id),
    );

    // 3. Process data efficiently
    const servicesToCreate = [] as any[];
    const servicesToUpdate = [] as any[];
    const mappingsToCreate = [] as any[];
    const pricingsToCreate = [] as any[];

    for (const item of dataArray) {
      if (!item.brand) continue;

      const category = categoryMap.get(item.brand.toUpperCase());
      if (!category) continue;

      const existingService = serviceMap.get(item.buyer_sku_code) as any;
      const existingMapping = mappingMap.get(item.buyer_sku_code) as any;

      if (existingService) {
        // Update existing service mapping price
        servicesToUpdate.push({
          service_id: existingService.id,
          providerId: item.buyer_sku_code,
          providerPrice: item.price,
          status: item.seller_product_status,
        });
      } else {
        // Prepare new service data
        const serviceData = {
          name: item.product_name,
          categoryId: category.id,
          description: item.desc || '',
          status: item.seller_product_status,
          providerId: item.buyer_sku_code, // Temporary for mapping
          providerPrice: item.price,
        };

        servicesToCreate.push(serviceData);
      }

      // Create mapping if not exists
      if (!existingMapping) {
        mappingsToCreate.push({
          providerId: item.buyer_sku_code,
          provider: provider,
          providerPrice: item.price,
          isActive: true,
        });
      }
    }

    // 4. Execute bulk operations
    const result = await this.executeBulkOperations({
      servicesToCreate,
      servicesToUpdate,
      mappingsToCreate,
      customerGroupMap,
      provider,
    });

    return {
      processed: dataArray.length,
      created: servicesToCreate.length,
      updated: servicesToUpdate.length,
      ...result,
    };
  }

  private async executeBulkOperations(operations: {
    servicesToCreate: any[];
    servicesToUpdate: any[];
    mappingsToCreate: any[];
    customerGroupMap: Map<string, number>;
    provider: string;
  }) {
    const BATCH_SIZE = 100;
    const createdServiceIds = [] as any[];

    // 1. Bulk create services
    if (operations.servicesToCreate.length > 0) {
      for (let i = 0; i < operations.servicesToCreate.length; i += BATCH_SIZE) {
        const batch = operations.servicesToCreate.slice(i, i + BATCH_SIZE);

        try {
          const serviceIds = await this.prisma.$queryRaw<{ id: number }[]>`
            INSERT INTO services (name, category_id, description, status, created_at, updated_at)
            VALUES ${Prisma.raw(
              batch
                .map(
                  (s) =>
                    `('${s.name.replace(/'/g, "''")}', ${s.categoryId}, '${(s.description || '').replace(/'/g, "''")}', '${s.status}', NOW(), NOW())`,
                )
                .join(', '),
            )}
            RETURNING id
          `;

          // Store created service IDs with their provider info
          serviceIds.forEach((result, index) => {
            createdServiceIds.push({
              id: result.id,
              providerId: batch[index].providerId,
              providerPrice: batch[index].providerPrice,
            });
          });
        } catch (error) {
          console.error(`Error creating services batch ${i}:`, error);
          continue;
        }
      }

      // 2. Create mappings for new services
      if (createdServiceIds.length > 0) {
        await this.createServiceMappings(
          createdServiceIds,
          operations.provider,
        );
        await this.createServicePricings(
          createdServiceIds,
          operations.customerGroupMap,
        );
      }
    }

    // 3. Bulk update service mappings
    if (operations.servicesToUpdate.length > 0) {
      await this.updateServiceMappings(
        operations.servicesToUpdate,
        operations.provider,
      );
    }

    return {
      mappingsCreated: createdServiceIds.length,
      servicesUpdated: operations.servicesToUpdate.length,
    };
  }

  private async createServiceMappings(
    serviceData: { id: number; providerId: string; providerPrice: number }[],
    provider: string,
  ) {
    const BATCH_SIZE = 200;

    for (let i = 0; i < serviceData.length; i += BATCH_SIZE) {
      const batch = serviceData.slice(i, i + BATCH_SIZE);

      try {
        await this.prisma.$queryRaw`
          INSERT INTO service_provider_mappings 
          (service_id, provider_id, provider, provider_price, is_active, created_at, updated_at)
          VALUES ${Prisma.raw(
            batch
              .map(
                (s) =>
                  `(${s.id}, '${s.providerId}', '${provider}', ${s.providerPrice}, 'active', NOW(), NOW())`,
              )
              .join(', '),
          )}
          ON CONFLICT (service_id, provider_id, provider) 
          DO UPDATE SET 
            provider_price = EXCLUDED.provider_price,
            updated_at = NOW()
        `;
      } catch (error) {
        console.error(`Error creating mappings batch ${i}:`, error);
      }
    }
  }

  private async createServicePricings(
    serviceData: { id: number }[],
    customerGroupMap: Map<string, number>,
  ) {
    const pricingData = [] as any;
    const profitMargins = { user: 4, reseller: 3, platinum: 2 };

    serviceData.forEach((service) => {
      ['user', 'reseller', 'platinum'].forEach((groupName) => {
        const customerGroupId = customerGroupMap.get(groupName);
        if (customerGroupId) {
          pricingData.push({
            service_id: service.id,
            customerGroupId,
            profit: profitMargins[groupName],
          });
        }
      });
    });

    if (pricingData.length > 0) {
      const BATCH_SIZE = 300;

      for (let i = 0; i < pricingData.length; i += BATCH_SIZE) {
        const batch = pricingData.slice(i, i + BATCH_SIZE);

        try {
          await this.prisma.$queryRaw`
            INSERT INTO service_pricings 
            (service_id, customer_group_id, price_sale, profit, is_active, created_at, updated_at)
            VALUES ${Prisma.raw(
              batch
                .map(
                  (p) =>
                    `(${p.service_id}, ${p.customerGroupId}, 0, ${p.profit}, 'active', NOW(), NOW())`,
                )
                .join(', '),
            )}
            ON CONFLICT (service_id, customer_group_id) 
            DO UPDATE SET profit = EXCLUDED.profit, updated_at = NOW()
          `;
        } catch (error) {
          console.error(`Error creating pricings batch ${i}:`, error);
        }
      }
    }
  }

  private async updateServiceMappings(
    updates: {
      service_id: number;
      providerId: string;
      providerPrice: number;
      status: string;
    }[],
    provider: string,
  ) {
    // Update in smaller batches to avoid query size limits
    const BATCH_SIZE = 50;

    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, i + BATCH_SIZE);

      try {
        // Use individual updates wrapped in transaction for better error handling
        await this.prisma.$transaction(async (tx) => {
          for (const update of batch) {
            await tx.$queryRaw`
              UPDATE service_provider_mappings 
              SET provider_price = ${update.providerPrice}, updated_at = NOW()
              WHERE service_id = ${update.service_id} AND provider = ${provider}
            `;

            await tx.$queryRaw`
              UPDATE services 
              SET status = ${update.status}, updated_at = NOW()
              WHERE id = ${update.service_id}
            `;
          }
        });
      } catch (error) {
        console.error(`Error updating services batch ${i}:`, error);
        continue;
      }
    }
  }

  // Utility method to get services with pricing info
  async getServicesWithPricing(categoryId?: number, customerGroupId?: number) {
    return this.prisma.$queryRaw`
      SELECT 
        s.id,
        s.name,
        s.description,
        s.status,
        c.name as categoryName,
        spm.provider,
        spm.provider_price,
        sp.price_sale,
        sp.profit,
        cg.name as customerGroup
      FROM services s
      JOIN categories c ON s.category_id = c.id
      LEFT JOIN service_provider_mappings spm ON s.id = spm.service_id AND spm.is_active = 'active'
      LEFT JOIN service_pricings sp ON s.id = sp.service_id
      LEFT JOIN customer_groups cg ON sp.customer_group_id = cg.id
      WHERE s.status = 'active'
        ${categoryId ? Prisma.sql`AND s.category_id = ${categoryId}` : Prisma.empty}
        ${customerGroupId ? Prisma.sql`AND sp.customer_group_id = ${customerGroupId}` : Prisma.empty}
      ORDER BY s.name, cg.name
    `;
  }

  // Get services with best provider pricing
  async getServicesWithBestPricing(categoryId?: number) {
    return this.prisma.$queryRaw`
      SELECT 
        s.id,
        s.name,
        s.category_id,
        c.name as categoryName,
        MIN(spm.provider_price) as bestProviderPrice,
        STRING_AGG(spm.provider, ', ') as availableProviders,
        COUNT(spm.provider) as providerCount
      FROM services s
      JOIN categories c ON s.category_id = c.id
      JOIN service_provider_mappings spm ON s.id = spm.service_id 
      WHERE spm.is_active = true AND s.status = 'active'
        ${categoryId ? Prisma.sql`AND s.category_id = ${categoryId}` : Prisma.empty}
      GROUP BY s.id, s.name, s.category_id, c.name
      HAVING COUNT(spm.provider) > 0
      ORDER BY s.name
    `;
  }
}
