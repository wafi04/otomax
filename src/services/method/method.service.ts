import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/lib/prisma/prisma.service";
import { CreateMethod, MethodData } from "./method.dto";

@Injectable()
export class MethodService {
    constructor(
        private prismaService: PrismaService
    ) {

    }

    async Create(req: CreateMethod) {
        return await this.prismaService.method.create({
            data: {
                ...req
            }
        })
    }


    async GetAll(limit: number, page: number, search?: string,status? : string) {
        try {
            // Input validation dengan detailed logging
            const validatedLimit = Math.min(Math.max(limit, 1), 100);
            const validatedPage = Math.max(page, 1);
            const offset = (validatedPage - 1) * validatedLimit;

            // Build query conditions
            const whereConditions: string[] = [];
            const queryParams: any[] = [];
            let paramIndex = 1;

            if (search && search.trim()) {
                whereConditions.push(`(name ILIKE $${paramIndex})`);
                const searchTerm = `%${search.trim()}%`;
                queryParams.push(searchTerm);
                paramIndex++;
            }
            if (status && status.trim()) {
                whereConditions.push(`(status ILIKE $${paramIndex})`);
                const searchTerm = `%${status.trim()}%`;
                queryParams.push(searchTerm);
                paramIndex++;
            }

            const whereClause = whereConditions.length > 0
                ? `WHERE ${whereConditions.join(' AND ')}`
                : '';

            // Build queries
            const countQuery = `SELECT COUNT(*)::integer as count FROM "Method" ${whereClause}`;

            const selectQuery = `
                SELECT 
                  id,
                  name,
                  description,
                  grub_name,
                  min_amount,
                  max_amount,
                  created_at,
                  updated_at,
                  fee,
                  image
                FROM "Method"
                ${whereClause}
                ORDER BY created_at DESC
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
              `;

            // Add limit and offset to params
            const countParams = [...queryParams];
            const selectParams = [...queryParams, validatedLimit, offset];

            const [totalResult, methods] = await Promise.all([
                this.prismaService.$queryRawUnsafe<[{ count: number }]>(countQuery, ...countParams),
                this.prismaService.$queryRawUnsafe<MethodData[]>(selectQuery, ...selectParams),
            ]);


            // Process results
            const total = totalResult[0]?.count || 0;
            const totalPages = Math.ceil(total / validatedLimit);
            const hasNext = validatedPage < totalPages;
            const hasPrev = validatedPage > 1;

            const result = {
                items: methods || [],
                pagination: {
                    page: validatedPage,
                    limit: validatedLimit,
                    total,
                    totalPages,
                    hasNext,
                    hasPrev,
                },
                message: `Successfully retrieved ${methods?.length || 0} methods`,
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
            throw new Error(`Failed to get methods: ${error.message}`);
        }

    }

    async Update(id: number, req: Partial<CreateMethod>) {
        return await this.prismaService.method.update({
          where: {
            id,
          },
          data: {
            ...req,
          },
        });
      }
    
    
      async Delete(id: number) {
        return await this.prismaService.method.delete({
          where: {
            id
          }
        })
      }

}