export type CategoryData = {
  id: number;
  name: string;
  subName: string;
  code?: string;
  brand: string;
  bannerUrl?: string;
  image?: string;
  desc: string;
  requestBy?: string;
  isCheckNickname: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateCategory = {
  name: string;
  sub_name: string;
  code?: string;
  banner_url?: string;
  image?: string;
  brand: string;
  desc: string;
  requestBy?: string;
  isCheckNickname: string;
  status: string;
};
