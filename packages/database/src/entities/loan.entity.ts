import Decimal from 'decimal.js';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { decimalTransformer } from '../decimal.transformer';
import { AccountEntity } from './account.entity';
import { AppUserEntity } from './app-user.entity';

@Entity('loan')
export class LoanEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => AppUserEntity, { nullable: false })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'fkjcauugddigslh9xi7v2n9tiwj',
  })
  user!: AppUserEntity;

  @ManyToOne(() => AccountEntity, { nullable: false })
  @JoinColumn({
    name: 'account_id',
    foreignKeyConstraintName: 'fkgv9cgsh4k76wmaf83ktoekpub',
  })
  account!: AccountEntity;

  @Column({ name: 'debtor_name', type: 'varchar', length: 255, nullable: true })
  debtorName!: string | null;

  @Column({ name: 'description', type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  @Column({
    name: 'amount',
    type: 'numeric',
    precision: 38,
    scale: 2,
    nullable: false,
    transformer: decimalTransformer,
  })
  amount!: Decimal;

  @Column({
    name: 'paid_amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: false,
    transformer: decimalTransformer,
  })
  paidAmount!: Decimal;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate!: string | null;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  status!: string | null;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  loanDate!: Date | null;
}
