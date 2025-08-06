import { ArgumentMetadata, Injectable, PipeTransform } from "@nestjs/common";
import * as querystring from 'querystring';

@Injectable()
export class FormToJsonPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (typeof value === 'string') {
      try {
        return querystring.parse(value);
      } catch (error) {
        throw new Error('Invalid form data format');
      }
    }
    
    return value;
  }
}