import { Injectable } from '@nestjs/common';
import { GetProductFromDigiflazz } from 'src/lib/digiflazz/digiflazz.dto';
import { PrismaService } from 'src/lib/prisma/prisma.service';

export type CreateTransactions = {
  productCode: string;
  customerPhone: string;
  nomorTujuan: string;
  customerName?: string;
  purchasePrice?: number;
  purchaseSell?: number;
  message?: string;
};

export type TransactionResponse = {
  id: string;
  orderId: string;
  nomorTujuan: string;
  productCode: string;
  status: string;
  customerPhone: string;
  customerName?: string;
  createdAt: string;
};

@Injectable()
export class TransactionRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(req: CreateTransactions): Promise<TransactionResponse> {
    try {
      const orderId = this.generateOrderId();
      const purchasePrice = req.purchasePrice ?? 0;
      const purchaseSell = req.purchaseSell ?? 0;
      const profit = purchaseSell - purchasePrice;
      const now = new Date();

      const result = await this.prismaService.$transaction(async (tx) => {
        const insertQuery = `
          INSERT INTO transactions (
            order_id,
            nomor_tujuan,
            purchase_price,
            purchase_sell,
            profit,
            product_code,
            message,
            log,
            status,
            customer_name,
            customer_phone,
            created_at,
            updated_at,
            processed_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
          ) RETURNING *;
        `;

        const insertResult = (await tx.$queryRawUnsafe(
          insertQuery,
          orderId,
          req.nomorTujuan,
          purchasePrice,
          purchaseSell,
          profit,
          req.productCode,
          req.message ?? '',
          '',
          'PENDING',
          req.customerName ?? '',
          req.customerPhone,
          now,
          now,
          null,
        )) as any[];

        return insertResult[0];
      });

      return {
        id: result.id,
        orderId: result.order_id,
        nomorTujuan: result.nomor_tujuan,
        productCode: result.product_code,
        status: result.status,
        customerPhone: result.customer_phone,
        customerName: result.customer_name,
        createdAt: result.created_at,
      };
    } catch (error) {
      throw new Error(`Failed to create transaction: ${error.message}`);
    }
  }

  async findById(id: string): Promise<TransactionResponse | null> {
    try {
      const query = `
        SELECT 
          id,
          order_id,
          nomor_tujuan,
          product_code,
          status,
          customer_phone,
          customer_name,
          created_at
        FROM transactions 
        WHERE id = $1;
      `;

      const result = (await this.prismaService.$queryRawUnsafe(
        query,
        id,
      )) as any[];

      if (!result || result.length === 0) {
        return null;
      }

      const transaction = result[0];
      return {
        id: transaction.id,
        orderId: transaction.order_id,
        nomorTujuan: transaction.nomor_tujuan,
        productCode: transaction.product_code,
        status: transaction.status,
        customerPhone: transaction.customer_phone,
        customerName: transaction.customer_name,
        createdAt: transaction.created_at,
      };
    } catch (error) {
      throw new Error(`Failed to find transaction: ${error.message}`);
    }
  }

  async findByOrderId(orderId: string): Promise<TransactionResponse | null> {
    try {
      const query = `
        SELECT 
          id,
          order_id,
          nomor_tujuan,
          product_code,
          status,
          customer_phone,
          customer_name,
          created_at
        FROM transactions 
        WHERE order_id = $1;
      `;

      const result = (await this.prismaService.$queryRawUnsafe(
        query,
        orderId,
      )) as any[];

      if (!result || result.length === 0) {
        return null;
      }

      const transaction = result[0];
      return {
        id: transaction.id,
        orderId: transaction.order_id,
        nomorTujuan: transaction.nomor_tujuan,
        productCode: transaction.product_code,
        status: transaction.status,
        customerPhone: transaction.customer_phone,
        customerName: transaction.customer_name,
        createdAt: transaction.created_at,
      };
    } catch (error) {
      throw new Error(
        `Failed to find transaction by order ID: ${error.message}`,
      );
    }
  }

  async updateStatus(id: string, status: string): Promise<TransactionResponse> {
    try {
      const now = new Date();
      const processedAt = status === 'SUCCESS' ? now : null;

      const result = await this.prismaService.$transaction(async (tx) => {
        const updateQuery = `
          UPDATE transactions 
          SET 
            status = $1,
            updated_at = $2,
            processed_at = $3
          WHERE id = $4
          RETURNING *;
        `;

        const updateResult = (await tx.$queryRawUnsafe(
          updateQuery,
          status,
          now,
          processedAt,
          id,
        )) as any[];

        if (!updateResult || updateResult.length === 0) {
          throw new Error('Transaction not found');
        }

        return updateResult[0];
      });

      return {
        id: result.id,
        orderId: result.order_id,
        nomorTujuan: result.nomor_tujuan,
        productCode: result.product_code,
        status: result.status,
        customerPhone: result.customer_phone,
        customerName: result.customer_name,
        createdAt: result.created_at,
      };
    } catch (error) {
      throw new Error(`Failed to update transaction status: ${error.message}`);
    }
  }

  private generateOrderId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `TRX${timestamp}${random}`;
  }
}
