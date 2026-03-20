import { Module } from '@nestjs/common';
import { UserMediaController } from './controllers/user-media.controller';
import { UsersController } from './controllers/users.controller';
import { UsersExportController } from './controllers/users-export.controller';
import { UsersReferralController } from './controllers/users-referral.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './services/users.service';
import { RolesModule } from './roles/roles.module';
import { UserSubscriber } from './subscribers/user.subscriber';
import { UsersEmailService } from './services/users-email.service';
import { UsersReferralService } from './services/users-referral.service';
import { UsersExportService } from './services/users-export.service';
import { UserMediaService } from './services/user-media.service';
import { USERS_RBAC_POLICY } from './users-rbac';
import { SessionAuthModule } from '@musanzi/nestjs-session-auth';

@Module({
  imports: [TypeOrmModule.forFeature([User]), RolesModule, SessionAuthModule.forFeature([USERS_RBAC_POLICY])],
  controllers: [UsersReferralController, UsersExportController, UserMediaController, UsersController],
  providers: [
    UsersService,
    UsersReferralService,
    UsersExportService,
    UserMediaService,
    UsersEmailService,
    UserSubscriber
  ],
  exports: [UsersService]
})
export class UsersModule {}
