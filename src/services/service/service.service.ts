import { Injectable } from '@nestjs/common';
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
        paramIndex += 2;
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(' AND ')}`
          : '';

      const countQuery = `SELECT COUNT(*) as count FROM "Service" ${whereClause}`;

      const selectQuery = `
              SELECT 
                id,
                name,
                description,
                "purchaseBuy",
                "createdAt",
                "updatedAt",
                "categoryId",
                "logoUrl"
              FROM "Service"
              ${whereClause}
              ORDER BY "createdAt" DESC
              LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `;

      queryParams.push(validatedLimit, offset);

      const [totalResult, services] = await Promise.all([
        this.prisma.$queryRawUnsafe<[{ count: bigint }]>(
          countQuery,
          ...queryParams.slice(0, -2),
        ), 
        this.prisma.$queryRawUnsafe<ServiceData[]>(selectQuery, ...queryParams),
      ]);

      const total = Number(totalResult[0].count);
      return {
        items: services,
        pagination: {
          page: validatedPage,
          limit: validatedLimit,
          total,
        },
        message: `Successfully retrieved ${services.length} services`,
      };
    } catch (error) {
      throw new Error('Failed to get data');
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


  async Delete(id : number){
    return await this.prisma.service.delete({
        where : {
            id
        }
    })
  }
}
