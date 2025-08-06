// src/common/configs/jwt.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  accessToken: {
    secret: process.env.JWT_SECRET || 'default-secret',
    expiresIn: '604800s', 
  },
  refreshToken: {
    secret: process.env.JWT_SECRET || 'default-secret',
    expiresIn: '604800s', 
  },
  development: {
    ignoreExpiration: true,
  },
  production: {
    ignoreExpiration: false,
  },
  redis: {
    host: "desired-chicken-9625.upstash.io",
    port: 6379,
    db: 0, // Ubah dari string ke number
    password: "ASWZAAIjcDE1RTc5OTg1NWVkOWU0MmMwOGQ1N2FiMDRmOTk4N2UxMHAxMA",
    username: "default"
  },
  duitku : {
    duitkuMerchantCode : process.env.DUITKU_MERCHANT_CODE,
    duitkuMerchantKey : process.env.DUITKU_MERCHANT_KEY,
    callbackDeposit : process.env.CALLBACK_DEPOSIT_URL,
    callbackTransactions : process.env.CALLBACK_DEPOSIT_TRANSACTIONS
  }
}));