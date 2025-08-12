import { Module } from '@nestjs/common';
import { DigiflazzService } from './digiflazz.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [ConfigService],
  providers: [DigiflazzService, ConfigService],
  exports: [DigiflazzService],
})
export class DigiflazzModule {}
