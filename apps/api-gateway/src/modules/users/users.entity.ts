import { Column, Entity, OneToOne } from 'typeorm';
import { PasswordEntity } from '../auth/passwords.entity';
import { YooBaseEntity } from '../commons/base.entity';

@Entity('users')
export class UserEntity extends YooBaseEntity {
  @Column({ length: 30, nullable: true })
  username: string;

  @Column({ length: 255, nullable: false, unique: true })
  email: string;

  @Column({ nullable: true, length: 50 })
  name: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ nullable: true })
  avatarKey: string;

  @Column({ nullable: true, length: 240 })
  bio?: string;

  @Column({ name: 'follower_count', default: 0 })
  followerCount: number;

  @Column({ name: 'followee_count', default: 0 })
  followeeCount: number;

  @Column('boolean', { default: false })
  verified: boolean;

  @OneToOne((type) => PasswordEntity, (password) => password.user, {
    lazy: true,
    cascade: true,
  })
  userPassword: PasswordEntity;
}
