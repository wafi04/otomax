import { Injectable, Logger } from "@nestjs/common";
import { DuitkuPostRequest, DuitkuPostResponse, DuitkuCallbackResponse } from "./duitku.dto";
import { ConfigService } from "@nestjs/config";
import crypto from "crypto";

@Injectable()
export class DuitkuService {
    private readonly logger = new Logger(DuitkuService.name);
    private readonly sandboxUrl = "https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry";
    private readonly prodUrl = "https://passport.duitku.com/webapi/api/merchant/v2/inquiry";
    private readonly DUITKU_MERCHANT_CODE: string;
    private readonly DUITKU_MERCHANT_KEY: string;
    private readonly isProduction: boolean;

    constructor(private configService: ConfigService) {
        this.DUITKU_MERCHANT_CODE = configService.get("duitku.duitkuMerchantCode") as string
        this.DUITKU_MERCHANT_KEY = configService.get("duitku.duitkuMerchantKey") as string;
        this.isProduction = configService.get("NODE_ENV") === "production";
        
        if (!this.DUITKU_MERCHANT_CODE || !this.DUITKU_MERCHANT_KEY) {
            throw new Error("Duitku merchant credentials are required");
        }
    }

    /**
     * Method 1: Generate signature for Duitku requests
     */
    private generateSignature(
        merchantCode: string,
        amount: number,
        merchantOrderId: string,
        merchantKey: string
    ): string {
        const signatureString = `${merchantCode}${amount}${merchantOrderId}${merchantKey}`;
        return crypto.createHash("md5").update(signatureString).digest("hex");
    }

    /**
     * Method 2: Create payment request to Duitku
     */
    async createPayment(req: Omit<DuitkuPostRequest, "signature" | "merchantCode">): Promise<DuitkuPostResponse> {
        try {
            const signature = this.generateSignature(
                this.DUITKU_MERCHANT_CODE,
                req.amount,
                req.merchantOrderId,
                this.DUITKU_MERCHANT_KEY
            );

            const payload: DuitkuPostRequest = {
                merchantCode: this.DUITKU_MERCHANT_CODE,
                paymentAmount: req.amount.toString(),
                merchantOrderId: req.merchantOrderId,
                paymentMethod: req.paymentMethod,
                returnUrl: req.returnUrl,
                callbackUrl: req.callbackUrl,
                amount: req.amount,
                signature
            };

            const url = this.isProduction ? this.prodUrl : this.sandboxUrl;
            
            const response = await fetch(url, {
                method: "POST",
                body: JSON.stringify(payload),
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error(`Duitku API error: ${response.status} ${response.statusText}`);
            }

            const result: DuitkuPostResponse = await response.json();
            
            this.logger.log(`Payment created successfully for order: ${req.merchantOrderId}`);
            return result;

        } catch (error) {
            this.logger.error(`Failed to create payment: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Method 3: Verify callback signature from Duitku
     */
    verifyCallback(callbackData: DuitkuCallbackResponse): boolean {
        try {
            const { merchantCode, amount, merchantOrderId, signature } = callbackData;
            
            const expectedSignature = this.generateSignature(
                merchantCode,
                amount,
                merchantOrderId,
                this.DUITKU_MERCHANT_KEY
            );

            const isValid = expectedSignature === signature;
            
            if (isValid) {
                this.logger.log(`Callback verified successfully for order: ${merchantOrderId}`);
            } else {
                this.logger.warn(`Invalid callback signature for order: ${merchantOrderId}`);
            }

            return isValid;

        } catch (error) {
            this.logger.error(`Failed to verify callback: ${error.message}`, error.stack);
            return false;
        }
    }
}