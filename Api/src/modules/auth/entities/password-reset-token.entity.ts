import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';

@Entity({ name: 'password_reset_tokens' })
@Index('uq_password_reset_tokens_user_id', ['userId'], { unique: true })
@Index('uq_password_reset_tokens_token_hash', ['tokenHash'], { unique: true })
@Index('idx_password_reset_tokens_expires_at', ['expiresAt'])
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'pk_password_reset_tokens',
  })
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'fk_password_reset_tokens_user',
  })
  user!: Relation<User>;

  @Column({
    name: 'token_hash',
    type: 'varchar',
    length: 64,
    select: false,
  })
  tokenHash!: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'consumed_at', type: 'timestamptz', nullable: true })
  consumedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
