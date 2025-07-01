import { Column, Entity, ManyToOne } from 'typeorm';
import { YooBaseEntity } from '../commons/base.entity';
import { UserEntity } from '../users/users.entity';

@Entity('sessions')
export class SessionsEntity extends YooBaseEntity {
  @Column()
  userId: string;

  @ManyToOne(() => UserEntity, { eager: true })
  user: UserEntity;
}
