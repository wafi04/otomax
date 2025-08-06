import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ServiceRepository } from './service.service';
import { CreateService } from './service.dto';


@Controller('product')
export class ProductController {

  constructor(private readonly productService: ServiceRepository) {}

  @Post()
  async Create(@Body() req: CreateService) {
    return this.productService.Create(req);
  }

  @Get()
  async GetAll(
    @Query() page: string,
    @Query() limit: string,
    @Query() search?: string,
  ) {
    return this.productService.GetAll(parseInt(limit), parseInt(page), search);
  }

  @Put()
  Update(@Param() id: string, @Body() data: Partial<CreateService>) {
    return this.productService.Update(parseInt(id), data);
  }


  @Delete()
  async Delete(
    @Param()  id : string
  ){
    return this.productService.Delete(parseInt(id))
  }
}
