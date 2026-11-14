import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, Employee, SalaryHistory } from '../entities/index.js';
import { SeederService } from './seeder.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const useSsl =
          configService.get<string>('DB_SSL') === 'true' ||
          configService.get<string>('NODE_ENV') === 'production';

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USERNAME', 'acme_user'),
          password: configService.get<string>('DB_PASSWORD', 'acme_password'),
          database: configService.get<string>('DB_NAME', 'acme_salaries'),
          entities: [User, Employee, SalaryHistory],
          synchronize: true, // Auto-create schema if not yet present
          logging: false,
          ssl: useSsl ? { rejectUnauthorized: false } : false,
        };
      },
    }),
    TypeOrmModule.forFeature([User, Employee, SalaryHistory]),
  ],
  providers: [SeederService],
})
class SeederModule { }

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeederModule);
  const seeder = app.get(SeederService);

  const count = process.env.SEED_COUNT ? parseInt(process.env.SEED_COUNT, 10) : 10000;

  try {
    await seeder.run(count);
    console.log('Seeding finished successfully.');
    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    await app.close();
    process.exit(1);
  }
}

await bootstrap();
