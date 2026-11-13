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

@Entity('transaction')
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => AccountEntity, (account) => account.transactions, {
    nullable: false,
  })
  @JoinColumn({
    name: 'account_id',
    foreignKeyConstraintName: 'fk6g20fcr3bhr6bihgy24rq1r1b',
  })
  account!: AccountEntity;

  @Column({
    name: 'transaction_type',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  transactionType!: string | null;

  @Column({
    name: 'amount',
    type: 'numeric',
    precision: 38,
    scale: 2,
    nullable: false,
    transformer: decimalTransformer,
  })
  amount!: Decimal;

  @Column({ name: 'description', type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  @Column({ name: 'location', type: 'varchar', length: 255, nullable: true })
  location!: string | null;

  @Column({
    name: 'transaction_date',
    type: 'timestamp',
    nullable: true,
  })
  transactionDate!: Date | null;
}
