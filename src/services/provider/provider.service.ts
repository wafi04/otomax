import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ProviderRepository } from './provider.repository';
import * as osu from 'node-os-utils';

@Injectable()
export class ProviderService {
  private readonly logger = new Logger(ProviderService.name);

  constructor(private readonly providerRepository: ProviderRepository) {}

  // Jalan tiap 5 menit
  @Cron('0 */2 * * * *')
  async syncProvidersJob() {
    try {
      const netstat = osu.netstat;
      const drive = osu.drive;

      // Sebelum sync@types/node-os-utils
      const diskInfo = await drive.info(
        '~/home/wafi/Documents/data/transactions/otomax',
      );
      const netInfo = await netstat.inOut();
      console.log(netInfo);

      this.logger.log(
        `📊 Before Sync - Disk Used: ${diskInfo.usedGb}GB / ${diskInfo.totalGb}GB`,
      );
      this.logger.log(`📡 Network - Input: ${netInfo}MB, Output: ${netInfo}MB`);

      // Proses sync data
      this.logger.log('🔄 Starting provider sync...');
      await this.providerRepository.syncAllProviders();
      this.logger.log('✅ Provider sync completed.');

      // Setelah sync (opsional)
      const diskAfter = await drive.info(
        '~/home/wafi/Documents/data/transactions/otomax',
      );
      const netAfter = await netstat.inOut();
      this.logger.log(
        `📊 After Sync - Disk Used: ${diskAfter.usedGb}GB / ${diskAfter.totalGb}GB`,
      );
      console.log(netAfter);
      this.logger.log(
        `📡 Network After - Input: ${netAfter}MB, Output: ${netAfter}MB`,
      );
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }
}
