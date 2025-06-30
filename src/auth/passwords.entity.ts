import { YooBaseEntity } from 'src/commons/base.entity';
import { UserEntity } from 'src/users/users.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

@Entity('passwords')
export class PasswordEntity extends YooBaseEntity {
  @Column()
  userId: string;

  @JoinColumn({ name: 'userId' })
  @OneToOne(() => UserEntity)
  user: UserEntity;

  @Column({ nullable: false })
  password: string;
}
