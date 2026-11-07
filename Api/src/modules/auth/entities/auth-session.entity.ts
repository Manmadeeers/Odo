import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';

@Entity({ name: 'auth_sessions' })
@Index('idx_auth_sessions_user_id', ['userId'])
@Index('idx_auth_sessions_expires_at', ['expiresAt'])
@Index('uq_auth_sessions_refresh_token_hash', ['refreshTokenHash'], {
  unique: true,
})
export class AuthSession {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'pk_auth_sessions',
  })
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'fk_auth_sessions_user',
  })
  user!: User;

  @Column({
    name: 'refresh_token_hash',
    type: 'varchar',
    length: 255,
    select: false,
  })
  refreshTokenHash!: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
