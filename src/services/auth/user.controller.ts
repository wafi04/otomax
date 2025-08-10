import { Controller, Get } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('user')
export class UserController {
  constructor(private authService: AuthService) {}

  @Get('all')
  async getAll() {
    return await this.authService.getAllUsers();
  }
}
