import { Global, Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthPasswordController } from './controllers/auth-password.controller';
import { AuthService } from './services/auth.service';
import { LocalStrategy } from './strategies/local.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { UsersModule } from '@/modules/users/users.module';
import { AuthEmailService } from './services/auth-email.service';
import { AuthPasswordService } from './services/auth-password.service';
import { SessionAuthModule } from '@musanzi/nestjs-session-auth';
import { SYSTEM_RBAC_POLICY } from './system-rbac';

@Global()
@Module({
  imports: [UsersModule, SessionAuthModule.forRoot({ policies: [SYSTEM_RBAC_POLICY] })],
  controllers: [AuthController, AuthPasswordController],
  providers: [AuthService, AuthPasswordService, LocalStrategy, GoogleStrategy, AuthEmailService],
  exports: [AuthService]
})
export class AuthModule {}
