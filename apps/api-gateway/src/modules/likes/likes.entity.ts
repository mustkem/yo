import { Entity, JoinColumn, ManyToOne } from 'typeorm';
import { YooBaseEntity } from '../commons/base.entity';
import { PostEntity } from '../posts/posts.entity';
import { UserEntity } from '../users/users.entity';

@Entity('likes')
export class LikesEntity extends YooBaseEntity {
  @ManyToOne(() => PostEntity)
  @JoinColumn({ name: 'post_id' })
  post: PostEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
