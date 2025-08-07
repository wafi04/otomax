import { Body, Controller, Delete, Get, InternalServerErrorException, Param, Post, Put, Query } from "@nestjs/common";
import { MethodService } from "./method.service";
import { CreateMethod } from "./method.dto";

@Controller("method")
export class MethodController {
    constructor(
        private readonly methodService: MethodService
    ) { }

    @Post()
    async Create(@Body() req: CreateMethod) {
        return await this.methodService.Create(req);
    }

    @Get()
    async GetAll(
        @Query('page') page: string,
        @Query('limit') limit: string,
        @Query('search') search?: string,
        @Query('status') status?: string,

    ) {
        try {
            const res = await this.methodService.GetAll(parseInt(limit), parseInt(page), search, status);
            console.log(res);
            return res;
        } catch (error) {
            console.error('🔥 Controller error:', error);
            throw new InternalServerErrorException(error.message);
        }
    }


    @Put()
    async Update(@Param() id: string, @Body() data: Partial<CreateMethod>) {
        return await this.methodService.Update(parseInt(id), data);
    }


    @Delete()
    async Delete(
        @Param() id: string
    ) {
        return await this.methodService.Delete(parseInt(id))
    }
}