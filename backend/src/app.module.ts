import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { User, Employee, SalaryHistory } from './database/entities/index.js';
import { CurrencyModule } from './modules/currency/currency.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { EmployeesModule } from './modules/employees/employees.module.js';
import { AnalyticsModule } from './modules/analytics/analytics.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    CacheModule.register({
      isGlobal: true,
      ttl: 60000,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProd = configService.get<string>('NODE_ENV') === 'production';
        const useSsl =
          configService.get<string>('DB_SSL') === 'true' || isProd;

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USERNAME', 'acme_user'),
          password: configService.get<string>('DB_PASSWORD', 'acme_password'),
          database: configService.get<string>('DB_NAME', 'acme_salaries'),
          entities: [User, Employee, SalaryHistory],
          synchronize:
            configService.get<string>('DB_SYNC') === 'true' || !isProd,
          logging: configService.get<string>('DB_LOGGING') === 'true',
          ssl: useSsl ? { rejectUnauthorized: false } : false,
        };
      },
    }),
    CurrencyModule,
    AuthModule,
    EmployeesModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
