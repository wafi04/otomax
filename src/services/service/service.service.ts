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
      if (error.code === 'P2002') {
        throw new Error('Database constraint violation');
      } else if (error.code === '42P01') {
        throw new Error('Table "Service" does not exist');
      } else if (error.code === '42703') {
        throw new Error('Column does not exist in Service table');
      } else if (error.message.includes('timeout')) {
        throw new Error('Database query timeout');
      } else if (error.message.includes('connection')) {
        throw new Error('Database connection failed');
      }

      throw new Error(`Failed to get services: ${error.message}`);
    }
  }

  async GetProductByCategoryCode(code: string) {
    try {
      const data = await this.prisma.$queryRaw`
    SELECT 
      s.name,
      s.logo_url AS "logoUrl",
      c.name AS "categoryName",
      c.sub_name AS "categorySubName"
    FROM services s
    JOIN categories c ON c.id = s.category_id
    WHERE c.code = ${code}
      AND s.status = 'true'
  `;

      return data;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new Error('Database constraint violation');
      } else if (error.code === '42P01') {
        throw new Error('Table "Service" does not exist');
      } else if (error.code === '42703') {
        throw new Error('Column does not exist in Service table');
      } else if (error.message.includes('timeout')) {
        throw new Error('Database query timeout');
      } else if (error.message.includes('connection')) {
        throw new Error('Database connection failed');
      }

      throw new Error(`Failed to get services: ${error.message}`);
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
