import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ServiceRepository } from './service.service';
import { CreateService } from './service.dto';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ServiceRepository) {}

  @Post()
  async Create(@Body() req: CreateService) {
    return await this.productService.Create(req);
  }
  @Get('category/:code')
  async GetByCategoryCode(@Param() code: { code: string }) {
    return await this.productService.GetProductByCategoryCode(
      code.code,
      'user',
    );
  }
  @Get()
  async GetAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search?: string,
  ) {
    try {
      const res = await this.productService.GetAll(
        parseInt(limit),
        parseInt(page),
        search,
      );
      console.log(res);
      return res;
    } catch (error) {
      console.error('🔥 Controller error:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  @Put()
  async Update(@Param() id: string, @Body() data: Partial<CreateService>) {
    return await this.productService.Update(parseInt(id), data);
  }

  @Delete()
  async Delete(@Param() id: string) {
    return await this.productService.Delete(parseInt(id));
  }
}
