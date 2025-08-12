export type GetProductFromDigiflazz = {
  product_name: string;
  category: string;
  brand: string;
  type: string;
  seller_name: string;
  price: number;
  buyer_sku_code: string;
  buyer_product_status: boolean;
  seller_product_status: boolean;
  unlimited_stock: boolean;
  stock: number;
  multi: boolean;
  start_cut_off: string;
  end_cut_off: string;
  desc: string;
};

export type DigiflazzReponseGetData = {
  data: GetProductFromDigiflazz[];
};

export interface TopUpRequest {
  noTujuan: string;
  reference: string;
  productCode: string;
  callbackUrl: string;
}

export interface ResponseTransaction {
  data: {
    ref_id: string;
    customer_no: string;
    buyer_sku_code: string;
    message: string;
    status: string;
    trx_id: string;
    rc: string;
    sn: string;
  };
}
export enum TRANSACTIONSTATUS {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PROCESS = 'PROCESS',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}
