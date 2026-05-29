import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { TransformInterceptor } from '@/shared/interceptors/transform.interceptor';
import { BlogModule, HighlightsModule } from './modules/content';
import { EventCategoriesModule, EventsModule } from './modules/events';
import { RolesModule, UsersModule } from './modules/identity';
import { ExpertisesModule, MentorsModule } from './modules/mentors';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OpportunitiesModule } from './modules/opportunities/opportunities.module';
import { ProgramCategoriesModule, ProgramSectorsModule, ProgramsModule, SubprogramsModule } from './modules/programs';
import { PhasesModule, ProjectCategoriesModule, ProjectsModule, ResourcesModule } from './modules/projects';
import { StatsModule } from './modules/stats/stats.module';
import { ProductsModule, VenturesModule } from './modules/ventures';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtModule } from '@/modules/jwt/jwt.module';
import { ConfigModule } from './modules/config/config.module';
import { DatabaseModule } from './modules/database/database.module';
import { EmailModule } from './modules/email/email.module';
import { GalleriesModule } from './modules/galleries/galleries.module';
import { StaticModule } from './modules/static/static.module';
import { RbacGuard, SessionAuthGuard } from '@musanzi/nestjs-session-auth';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule,
    DatabaseModule,
    EmailModule,
    GalleriesModule,
    JwtModule,
    StaticModule,
    AuthModule,
    BlogModule,
    HighlightsModule,
    EventsModule,
    EventCategoriesModule,
    UsersModule,
    RolesModule,
    MentorsModule,
    ExpertisesModule,
    NotificationsModule,
    OpportunitiesModule,
    ProgramsModule,
    SubprogramsModule,
    ProgramSectorsModule,
    ProgramCategoriesModule,
    PhasesModule,
    ProjectCategoriesModule,
    ProjectsModule,
    ResourcesModule,
    StatsModule,
    VenturesModule,
    ProductsModule
  ],
  providers: [
    { provide: APP_GUARD, useClass: SessionAuthGuard },
    { provide: APP_GUARD, useClass: RbacGuard },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor }
  ]
})
export class AppModule {}
