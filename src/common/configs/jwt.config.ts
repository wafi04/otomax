import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  accessToken: {
    secret: process.env.JWT_SECRET,
    expiresIn: '604800s', 
  },
  refreshToken: {
    secret: process.env.JWT_SECRET,
        expiresIn: '604800s', 

  },
  development: {
    ignoreExpiration: true,
  },
  production: {
    ignoreExpiration: false,
  },
}));