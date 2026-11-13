import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AccountEntity } from './account.entity';

@Entity('app_user')
export class AppUserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'telegram_chat_id',
    type: 'varchar',
    length: 255,
    nullable: true,
    unique: true,
  })
  telegramChatId!: string | null;

  @Column({
    name: 'email',
    type: 'varchar',
    length: 255,
    nullable: true,
    unique: true,
  })
  email!: string | null;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  passwordHash!: string | null;

  @Column({
    name: 'refresh_token_hash',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  refreshTokenHash!: string | null;

  @Column({ name: 'alias', type: 'varchar', length: 255, nullable: true })
  alias!: string | null;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt!: Date | null;

  @OneToMany(() => AccountEntity, (account) => account.user)
  accounts!: AccountEntity[];
}
