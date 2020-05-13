import { IsDate } from 'class-validator';
import { Break } from '../interfaces/sheet.interface';

export class CreateDto {
  @IsDate()
  start: Date;

  @IsDate()
  end: Date;

  breaks?: Break[];
}
