import { IsNotEmpty, IsEmail } from 'class-validator';

export class JWTDecryptedDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  userId: string;
}
