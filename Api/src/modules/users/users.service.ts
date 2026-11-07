import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { EntityManager, Repository } from 'typeorm';
import { User } from './entities/user.entity.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  create(
    email: string,
    passwordHash: string,
    manager?: EntityManager,
  ): Promise<User> {
    const repository = manager?.getRepository(User) ?? this.usersRepository;
    return repository.save(
      repository.create({
        email,
        passwordHash,
        emailVerifiedAt: null,
      }),
    );
  }

  findByEmailForAuthentication(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await this.usersRepository.update({ id }, { passwordHash });
  }
}
