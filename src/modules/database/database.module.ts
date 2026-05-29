import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mariadb',
        port: +configService.get('DB_PORT'),
        host: configService.get('DB_HOST'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        username: configService.get('DB_USERNAME'),
        subscribers: ['dist/**/*.subscriber.js'],
        entities: ['dist/**/*.entity.js'],
        autoLoadEntities: false,
        synchronize: false
      })
    })
  ]
})
export class DatabaseModule {}
