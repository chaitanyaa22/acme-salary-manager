import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity.js';
import { Employee } from '../entities/employee.entity.js';
import { SalaryHistory } from '../entities/salary-history.entity.js';
import { DeterministicGenerator } from './deterministic-generator.js';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);
  private readonly generator = new DeterministicGenerator();

  constructor(private readonly dataSource: DataSource) {}

  async run(employeeCount = 10000): Promise<void> {
    const startTime = Date.now();
    this.logger.log(`Starting deterministic database seeding (Target: ${employeeCount} employees)...`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // 1. Clean existing records in referential integrity order
      this.logger.log('Clearing existing data from salary_history, employees, and users tables...');
      await queryRunner.query('TRUNCATE TABLE "salary_history", "employees", "users" RESTART IDENTITY CASCADE;');

      // 2. Seed Demo Users
      this.logger.log('Seeding demo accounts (Admin: admin@acme.com, Viewer: viewer@acme.com)...');
      const adminHash = await bcrypt.hash('admin123', 10);
      const viewerHash = await bcrypt.hash('viewer123', 10);
      const usersData = this.generator.generateDemoUsers(adminHash, viewerHash);

      const userRepository = this.dataSource.getRepository(User);
      const savedUsers = await userRepository.save(usersData);
      this.logger.log(`Seeded ${savedUsers.length} demo users successfully.`);

      // 3. Generate and batch-insert 10,000 Employees
      this.logger.log(`Generating ${employeeCount} deterministic employees across 5 countries...`);
      const employeesData = this.generator.generateEmployees(employeeCount);

      const employeeRepository = this.dataSource.getRepository(Employee);
      const chunkSize = 1000;
      let insertedCount = 0;

      for (let i = 0; i < employeesData.length; i += chunkSize) {
        const chunk = employeesData.slice(i, i + chunkSize);
        await employeeRepository
          .createQueryBuilder()
          .insert()
          .into(Employee)
          .values(chunk)
          .execute();

        insertedCount += chunk.length;
        this.logger.log(`Inserted ${insertedCount}/${employeeCount} employees...`);
      }

      // 4. Retrieve seeded employees to attach initial audit records
      this.logger.log('Generating initial salary revision audit trail (SalaryHistory)...');
      const sampleEmployees = await employeeRepository.find({
        take: 2500,
        select: {
          id: true,
          currency: true,
          baseSalaryMinor: true,
          baseSalaryUsdMinor: true,
        },
      });

      const historyData = this.generator.generateSalaryHistories(sampleEmployees, 1.0);
      const historyRepository = this.dataSource.getRepository(SalaryHistory);

      for (let i = 0; i < historyData.length; i += chunkSize) {
        const chunk = historyData.slice(i, i + chunkSize);
        await historyRepository
          .createQueryBuilder()
          .insert()
          .into(SalaryHistory)
          .values(chunk)
          .execute();
      }
      this.logger.log(`Seeded ${historyData.length} salary history audit trail records.`);

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.log(`Database seeding completed successfully in ${elapsed}s!`);
    } catch (error) {
      this.logger.error('Error during database seeding:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
