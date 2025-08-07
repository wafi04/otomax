export type CreateMethod = {
    name: string
    grubName: string
    image: string
    description: string
    minAmount: number
    maxAmount: number
    fee: number
    status: string
}


export type MethodData = CreateMethod & {
    id : number
    createdAt : string
    updatedAt : string
}



