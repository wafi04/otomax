import { Module } from '@nestjs/common';
import { ProviderRepository } from './provider.repository';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { DigiflazzService } from 'src/lib/digiflazz/digiflazz.service';
import { ProviderController } from './provider.controller';
import { ProviderService } from './provider.service';

@Module({
  controllers: [ProviderController],
  providers: [
    ProviderRepository,
    ProviderService,
    PrismaService,
    DigiflazzService,
  ],
})
export class ProviderModule {}
