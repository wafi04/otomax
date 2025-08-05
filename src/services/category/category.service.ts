import { Injectable } from '@nestjs/common';
import { PaginatedData } from 'src/common/interceptors/response.interceptor';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { CategoryData, CreateCategory } from 'src/types/category';


@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async Create(req: CreateCategory) {
    try {
      return await this.prisma.category.create({
        data: {
          brand: req.brand,
          isCheckNickname: req.isCheckNickname,
          name: req.name,
          status: req.status,
          subName: req.subName,
          code: req.code,
          desc: req.desc,
        },
      });
    } catch (error) {
      throw new Error('failed to created : ', error);
    }
  }

async getAll(
    limit: number = 10,
    page: number = 1,
    search?: string,
    status?: string
  ): Promise<PaginatedData<CategoryData>> {
    try {
      const validatedLimit = Math.min(Math.max(limit, 1), 100);
      const validatedPage = Math.max(page, 1);
      const offset = (validatedPage - 1) * validatedLimit;
      
      const whereConditions: string[] = [];
      const queryParams: any[] = [];
      let paramIndex = 1;

      if (search && search.trim()) {
        whereConditions.push(
          `(name ILIKE $${paramIndex} OR sub_name ILIKE $${paramIndex + 1} OR code ILIKE $${paramIndex + 2} OR brand ILIKE $${paramIndex + 3})`
        );
        const searchTerm = `%${search.trim()}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
        paramIndex += 4;
      }

      if (status && status.trim()) {
        whereConditions.push(`status = $${paramIndex}`);
        queryParams.push(status.trim());
        paramIndex += 1;
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}` 
        : '';

      const countQuery = `SELECT COUNT(*) as count FROM categories ${whereClause}`;
      const selectQuery = `
        SELECT 
          id,
          name,
          sub_name,
          code,
          brand,
          "bannerUrl",
          image,
          "desc",
          "requestBy",
          is_check_nickname,
          status,
          "createdAt"::text,
          "updatedAt"::text
        FROM categories
        ${whereClause}
        ORDER BY "createdAt" DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(validatedLimit, offset);

      const [totalResult, categories] = await Promise.all([
        this.prisma.$queryRawUnsafe<[{ count: bigint }]>(countQuery, ...queryParams.slice(0, -2)), // Remove limit/offset for count
        this.prisma.$queryRawUnsafe<CategoryData[]>(selectQuery, ...queryParams),
      ]);

      const total = Number(totalResult[0].count);

      return {
        items: categories,
        pagination: {
          page: validatedPage,
          limit: validatedLimit,
          total,
        },
        message: `Successfully retrieved ${categories.length} categories`,
      };
    } catch (error) {
      console.error('Error in getAll:', error);
      throw new Error('Failed to get data');
    }
  }

  async Update(id: number, req: Partial<CreateCategory>) {
    try {
      return await this.prisma.category.update({
        where: {
          id,
        },
        data: {
          ...req,
        },
      });
    } catch (error) {
      throw new Error('failed to update data');
    }
  }


  async Delete(id: number) {
    try {
      return await this.prisma.category.delete({
        where: {
          id,
        },
      });
    } catch (error) {
      throw new Error('failed to deleted data');
    }
  }
}
