import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';

export class OptionalJwtAuthGuard extends AuthGuard('jwt') {

  // Override handleRequest so it never throws an error
  handleRequest(err, user, info, context) {
    return user;
  }

}

export default JwtModule.register({
  secret: process.env.JWT_SECRET,
  signOptions: { expiresIn: '2 days' },
});
