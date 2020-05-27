import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
  ) {}

  sign(userId: string, email: string) {
    const payload = {
      userId,
      email,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
