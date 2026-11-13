import Decimal from 'decimal.js';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { decimalTransformer } from '../decimal.transformer';
import { AppUserEntity } from './app-user.entity';
import { TransactionEntity } from './transaction.entity';

@Entity('account')
export class AccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => AppUserEntity, (user) => user.accounts, {
    nullable: false,
  })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'fkjajia7qudllc01cly9yddon8u',
  })
  user!: AppUserEntity;

  @Column({ name: 'name', type: 'varchar', length: 255, nullable: true })
  name!: string | null;

  @Column({
    name: 'balance',
    type: 'numeric',
    precision: 38,
    scale: 2,
    nullable: false,
    transformer: decimalTransformer,
  })
  balance!: Decimal;

  @Column({ name: 'currency', type: 'varchar', length: 3, nullable: true })
  currency!: string | null;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt!: Date | null;

  @OneToMany(() => TransactionEntity, (transaction) => transaction.account)
  transactions!: TransactionEntity[];
}
