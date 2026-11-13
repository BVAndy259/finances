import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AccountEntity } from './account.entity';

@Entity('app_user')
export class AppUserEntity {
  @PrimaryGeneratedColumn('identity', {
    type: 'bigint',
    generatedIdentity: 'BY DEFAULT',
  })
  id!: number;

  @Column({
    name: 'telegram_chat_id',
    type: 'varchar',
    length: 255,
    nullable: false,
    unique: true,
  })
  telegramChatId!: string;

  @Column({ name: 'alias', type: 'varchar', length: 255, nullable: true })
  alias!: string | null;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt!: Date | null;

  @OneToMany(() => AccountEntity, (account) => account.user)
  accounts!: AccountEntity[];
}
