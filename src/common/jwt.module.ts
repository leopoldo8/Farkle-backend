import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './secret';

export default JwtModule.register({
  secret: jwtConstants.secret,
  signOptions: { expiresIn: '2 days' },
});
