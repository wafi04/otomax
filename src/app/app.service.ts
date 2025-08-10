import { Injectable } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
  @EventPattern('say_hello')
  handleMessage(@Payload() data: any) {
    console.log('📩 Received:', data);
  }
}
