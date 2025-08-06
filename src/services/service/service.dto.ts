export interface CreateService {
  name: string;
  purchaseBuy: number;
  description?: string;
  logoUrl: string;
  status  : string
  categoryId: number;
}

export interface ServiceData extends CreateService {
  id: string;
  createdAt: string;
  updatedAt: string;
}
