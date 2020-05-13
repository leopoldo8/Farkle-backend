import { IsNotEmpty, IsAlphanumeric, IsNumber, IsEmail } from 'class-validator';

export class CreateDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  hoursPerDay: Number;

  @IsNotEmpty()
  @IsAlphanumeric()
  password: string;
}
