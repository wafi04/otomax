import { PaginatedData } from "src/common/interceptors/response.interceptor";
import { PrismaService } from "src/lib/prisma/prisma.service";
import { CategoryData, CreateCategory } from "src/types/category";

export class CategoryService {
    constructor(
        private readonly prisma: PrismaService
    ) {

    }

    async Create(req: CreateCategory) {
        try {
            return await this.prisma.category.create({
                data: {
                    ...req
                }
            })
        } catch (error) {
            throw error
        }
    }


    async getAll(limit: number = 10, page: number = 1): Promise<PaginatedData<CategoryData>> {
    
    try {
      const validatedLimit = Math.min(Math.max(limit, 1), 100);
      const validatedPage = Math.max(page, 1);
      const offset = (validatedPage - 1) * validatedLimit;

      // Execute count and data queries in parallel using raw SQL
      const [totalResult, categories] = await Promise.all([
        this.prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*) as count FROM "Category"
        `,
        this.prisma.$queryRaw<CategoryData[]>`
          SELECT 
            id,
            name,
            sub_name,
            code,
            brand,
            banner_url,
            image,
            "desc",
            "requestBy",
            is_check_nickname,
            status,
            created_at::text,
            updatedAt::text
          FROM categories
          ORDER BY created_at DESC
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
      throw error;
    }
  }

}