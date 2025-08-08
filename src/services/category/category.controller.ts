import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Put,
  Param,
  Delete,
} from '@nestjs/common';
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
      data: {
        ...category,
        sub_name: category.subName,
        banner_url: category.bannerUrl,
      },
    };
  }

  @Get()
  async getAll(
    @Query('limit') limit?: string,
    @Query('page') page?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const pageNum = page ? parseInt(page, 10) : 1;
    return await this.categoryService.getAll(limitNum, pageNum, search, status);
  }

  @Put(':id')
  async update(
    @Param() @Param() id: { id: string },
    @Body() req: Partial<CreateCategory>,
  ) {
    try {
      return await this.categoryService.Update(parseInt(id.id), req);
    } catch (error) {
      console.log(error);
    }
  }

  @Delete(':id')
  async delete(@Param() id: { id: string }) {
    try {
      return await this.categoryService.Delete(parseInt(id.id));
    } catch (error) {
      console.log(error);
    }
  }
}
