export type CategoryData = {
    id: number
    name: string
    subName: string
    code?: string
    brand: string
    bannerUrl? : string
    image? : string
    desc: string
    requestBy?: string
    isCheckNickname: string
    status: string
    createdAt: string
    updatedAt: string
}

export type CreateCategory = {
    name: string
    subName: string
    code?: string
    bannerUrl? : string
    image? : string
    brand: string
    desc: string
    requestBy?: string
    isCheckNickname: string
    status: string
}