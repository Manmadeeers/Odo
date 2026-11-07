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

@Entity({ name: 'email_verification_tokens' })
@Index('uq_email_verification_tokens_user_id', ['userId'], { unique: true })
@Index('uq_email_verification_tokens_token_hash', ['tokenHash'], {
  unique: true,
})
@Index('idx_email_verification_tokens_expires_at', ['expiresAt'])
export class EmailVerificationToken {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'pk_email_verification_tokens',
  })
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'fk_email_verification_tokens_user',
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
