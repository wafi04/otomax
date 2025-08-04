import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategory } from 'src/types/category';

@Controller('categories')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Post()
  async create(@Body() createCategoryDto: CreateCategory) {
    const category = await this.categoryService.Create(createCategoryDto);
    return {
      message: 'Category created successfully',
      data: category,
    };
  }

  @Get()
  async getAll(
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const pageNum = page ? parseInt(page, 10) : 1;

    return await this.categoryService.getAll(limitNum, pageNum);
  }
}
