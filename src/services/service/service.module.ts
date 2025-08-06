import { Module } from "@nestjs/common";
import { ProductController } from "./service.controller";
import { ServiceRepository } from "./service.service";
import { PrismaService } from "src/lib/prisma/prisma.service";

@Module({
    controllers : [ProductController],
    providers : [ServiceRepository,PrismaService]
})


export class ProductModule{}