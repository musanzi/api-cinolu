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
import { ConfigModule } from './modules/config/config.module';
import { DatabaseModule } from './modules/database/database.module';
import { EmailModule } from './modules/email/email.module';
import { GalleriesModule } from './modules/galleries/galleries.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from './modules/auth/guards/auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 50 }]
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: { singleLine: true, colorize: true }
        }
      }
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads'
    }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        global: true,
        secret: configService.getOrThrow('JWT_SECRET'),
        signOptions: { expiresIn: '1d' }
      })
    }),
    ConfigModule,
    DatabaseModule,
    EmailModule,
    GalleriesModule,
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
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor }
  ]
})
export class AppModule {}
