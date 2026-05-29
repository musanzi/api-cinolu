import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config({
  path: '.env'
});

export default new DataSource({
  type: 'mariadb',
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  database: process.env.DB_NAME,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  synchronize: false,
  migrations: ['dist/shared/database/migrations/*.js'],
  entities: ['dist/**/*.entity.js']
});
