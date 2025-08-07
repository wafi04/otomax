import { Module } from "@nestjs/common";
import { PrismaService } from "src/lib/prisma/prisma.service";
import { MethodController } from "./method.controller";
import { MethodService } from "./method.service";

@Module({
    controllers : [MethodController],
    providers : [MethodService,PrismaService]
})


export class MethodModule{}