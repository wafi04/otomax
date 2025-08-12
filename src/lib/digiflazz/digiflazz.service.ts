import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { DigiflazzReponseGetData, TopUpRequest } from './digiflazz.dto';
import { TransactionResponse } from 'src/services/transactions/transaction.repository';

export class DigiflazzService {
  private readonly logger = new Logger(DigiflazzService.name);
  private readonly DIGIFLAZZ_USERNAME = '';
  private readonly DIGIFLAZZ_API_KEY = '';

  constructor(private readonly configService: ConfigService) {}
  async checkPrice(): Promise<DigiflazzReponseGetData> {
    try {
      const sign = crypto
        .createHash('md5')
        .update(this.DIGIFLAZZ_API_KEY)
        .digest('hex');

      console.log(this.DIGIFLAZZ_API_KEY);
      console.log(this.DIGIFLAZZ_USERNAME);

      const payload = {
        cmd: 'pricelist',
        username: this.DIGIFLAZZ_USERNAME,
        sign: sign,
      };

      const response = await fetch('https://api.digiflazz.com/v1/price-list', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        console.error('Digiflazz price check error:', error.message);
      }
      throw error;
    }
  }

  async TopUp(topUpData: TopUpRequest) {
    try {
      const signature = crypto
        .createHash('md5')
        .update(
          this.DIGIFLAZZ_USERNAME +
            this.DIGIFLAZZ_API_KEY +
            topUpData.reference,
        )
        .digest('hex');

      const noTujuan = topUpData.noTujuan.trim();

      const data = {
        username: this.DIGIFLAZZ_USERNAME,
        buyer_sku_code: topUpData.productCode,
        customer_no: noTujuan,
        ref_id: topUpData.reference,
        cb_url: topUpData.callbackUrl,
        sign: signature,
      };

      const response = await fetch('https://api.digiflazz.com/v1/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: TransactionResponse = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error making order:', error.message);
        throw error;
      }
    }
  }
}
