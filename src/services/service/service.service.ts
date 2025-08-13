import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { CreateService, ServiceData } from './service.dto';

@Injectable()
export class ServiceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async Create(req: CreateService) {
    const data = await this.prisma.service.create({
      data: {
        ...req,
      },
    });

    return data;
  }

  async GetAll(limit: number, page: number, search?: string) {
    try {
      const validatedLimit = Math.min(Math.max(limit, 1), 100);
      const validatedPage = Math.max(page, 1);
      const offset = (validatedPage - 1) * validatedLimit;

      const whereConditions: string[] = [];
      const queryParams: any[] = [];
      let paramIndex = 1;

      if (search && search.trim()) {
        whereConditions.push(`(name ILIKE $${paramIndex})`);
        const searchTerm = `%${search.trim()}%`;
        queryParams.push(searchTerm);
        paramIndex++;
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(' AND ')}`
          : '';

      const countQuery = `SELECT COUNT(*)::integer as count FROM "Service" ${whereClause}`;

      const selectQuery = `
        SELECT 
          id,
          name,
          description,
          status,
          created_at AS "CreatedAt",
          updatedAt AS "UpdatedAt",
          category_id AS "categoryId",
          logo_url AS "logoUrl"
        FROM services
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const countParams = [...queryParams];
      const selectParams = [...queryParams, validatedLimit, offset];

      const [totalResult, services] = await Promise.all([
        this.prisma.$queryRawUnsafe<[{ count: number }]>(
          countQuery,
          ...countParams,
        ),
        this.prisma.$queryRawUnsafe<ServiceData[]>(
          selectQuery,
          ...selectParams,
        ),
      ]);

      const total = totalResult[0]?.count || 0;
      const totalPages = Math.ceil(total / validatedLimit);
      const hasNext = validatedPage < totalPages;
      const hasPrev = validatedPage > 1;

      const result = {
        items: services || [],
        pagination: {
          page: validatedPage,
          limit: validatedLimit,
          total,
          totalPages,
          hasNext,
          hasPrev,
        },
        message: `Successfully retrieved ${services?.length || 0} services`,
      };
      return result;
    } catch (error) {
      throw new Error(`Failed to get services: ${error.message}`);
    }
  }

  async GetProductByCategoryCode(code: string, role?: string) {
    try {
      // Pastikan role-nya sesuai dengan nama kolom di DB
      const roleColumnMap: Record<string, string> = {
        user: 'sp.price_user',
        reseller: 'sp.price_reseller',
        platinum: 'sp.price_platinum',
      };

      // Default kalau role tidak ada / tidak cocok → pakai price_user
      const priceColumn = role
        ? roleColumnMap[role.toLowerCase()] || 'sp.price_user'
        : 'sp.price_user';

      const query = `
      SELECT 
        s.id,
        s.name,
        s.logo_url AS "logoUrl",
        s.description,
        s.status AS "serviceStatus",
        c.name AS "categoryName",
        c.sub_name AS "categorySubName",
        c.brand,
        c.desc AS "categoryDescription",
        c.thumbnail,
        c.instruction,
        c.information,
        c.placeholder_1 AS "placeholder1",
        c.placeholder_2 AS "placeholder2",
        c.is_check_nickname AS "isCheckNickname",
        ${priceColumn} AS "price"
      FROM services s
      JOIN categories c 
        ON c.id = s.category_id
      LEFT JOIN service_pricings sp 
        ON sp.service_id = s.id AND sp.is_active = 'active'
      WHERE c.code = $1
        AND s.status = 'true'
        AND c.status = 'active'
      GROUP BY 
        s.id, s.name, s.logo_url, s.description, s.status, 
        c.name, c.sub_name, c.brand, c.desc,
        c.thumbnail, c.instruction, c.information, 
        c.placeholder_1, c.placeholder_2, c.is_check_nickname, ${priceColumn}
      ORDER BY s.name ASC
    `;

      return await this.prisma.$queryRawUnsafe(query, code);
    } catch (error: any) {
      console.error(error);
      throw new Error(
        `Failed to get services by category code: ${error.message}`,
      );
    }
  }
  async Update(id: number, req: Partial<CreateService>) {
    return await this.prisma.service.update({
      where: {
        id,
      },
      data: {
        ...req,
      },
    });
  }

  async Delete(id: number) {
    return await this.prisma.service.delete({
      where: {
        id,
      },
    });
  }
}
