import { IsNotEmpty, IsAlphanumeric, IsNumber, IsEmail } from 'class-validator';

export class CreateDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsAlphanumeric()
  password: string;
}

export class SignDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsAlphanumeric()
  password: string;
}
