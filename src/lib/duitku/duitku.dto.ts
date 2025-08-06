export interface DuitkuPostRequest {
    merchantCode : string
    paymentAmount : string
    merchantOrderId : string
    paymentMethod : string
    returnUrl : string
    amount : number
    callbackUrl : string
    // combine (merchantCode + amount + merchantkey)
    signature : string
}



export  interface DuitkuPostResponse {
    merchantCode : string
    paymentUrl : string
    vaNumber : string
    amount : string
    qrString? : string
}



export interface DuitkuCallbackResponse {
    resultCode : "00" | "01"
    merchantOrderId : string
        amount : number
    paymentCode : string
    merchantCode : string
    // combine (merchantCode + amount + merchantkey)
    signature : string
}