import { YooBaseEntity } from 'src/commons/base.entity';
import { UserEntity } from 'src/users/users.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity('sessions')
export class SessionsEntity extends YooBaseEntity {
  @Column()
  userId: string;

  @ManyToOne(() => UserEntity, { eager: true })
  user: UserEntity;
}
