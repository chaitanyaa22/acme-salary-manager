import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Currency } from '../../common/enums/currency.enum.js';
import { ColumnNumericTransformer } from '../../common/transformers/column-numeric.transformer.js';
import { Employee } from './employee.entity.js';

@Entity('salary_history')
@Index('idx_salary_history_employee_id', ['employeeId'])
@Index('idx_salary_history_effective_date', ['effectiveDate'])
export class SalaryHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @ManyToOne(() => Employee, (employee) => employee.salaryHistories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({
    name: 'previous_salary_minor',
    type: 'bigint',
    transformer: new ColumnNumericTransformer(),
  })
  previousSalaryMinor: number;

  @Column({
    name: 'new_salary_minor',
    type: 'bigint',
    transformer: new ColumnNumericTransformer(),
  })
  newSalaryMinor: number;

  @Column({
    name: 'previous_salary_usd_minor',
    type: 'bigint',
    transformer: new ColumnNumericTransformer(),
  })
  previousSalaryUsdMinor: number;

  @Column({
    name: 'new_salary_usd_minor',
    type: 'bigint',
    transformer: new ColumnNumericTransformer(),
  })
  newSalaryUsdMinor: number;

  @Column({
    type: 'enum',
    enum: Currency,
  })
  currency: Currency;

  @Column({ name: 'effective_date', type: 'date' })
  effectiveDate: string;

  @Column()
  reason: string;

  @Column({ name: 'changed_by', nullable: true })
  changedBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
