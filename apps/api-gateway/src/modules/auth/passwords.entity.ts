import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { YooBaseEntity } from '../commons/base.entity';
import { UserEntity } from '../users/users.entity';

@Entity('passwords')
export class PasswordEntity extends YooBaseEntity {
  @Column({ name: 'user_id' })
  user_id: string;

  @JoinColumn({ name: 'user_id' })
  @OneToOne(() => UserEntity)
  user: UserEntity;

  @Column({ nullable: false })
  password: string;
}
