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
  ): Promise<PaginatedData<CategoryData>> {
    try {
      const validatedLimit = Math.min(Math.max(limit, 1), 100);
      const validatedPage = Math.max(page, 1);
      const offset = (validatedPage - 1) * validatedLimit;

      const [totalResult, categories] = await Promise.all([
        this.prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*) as count  FROM categories
        `,
        this.prisma.$queryRaw<CategoryData[]>`
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
          ORDER BY "createdAt" DESC
          LIMIT ${validatedLimit} OFFSET ${offset}
        `,
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
      throw new Error('failed to get data');
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
