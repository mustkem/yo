import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { YooBaseEntity } from '../commons/base.entity';
import { UserEntity } from '../users/users.entity';

@Entity('posts')
export class PostEntity extends YooBaseEntity {
  @Column({ length: 240, nullable: true })
  text: string;

  @Column('json', { nullable: true })
  images: Array<string>;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'author_id' })
  author: UserEntity;

  @Column({ name: 'like_count', default: 0 })
  likeCount: number;

  @Column({ name: 'repost_count', default: 0 })
  repostCount: number;

  @Column('json', { nullable: true })
  hashtags: Array<string>;

  @Column('json', { nullable: true })
  mentions: Array<Mention>;

  @OneToOne(() => PostEntity)
  @JoinColumn({ name: 'orig_post_id' })
  origPost: PostEntity;

  @OneToOne(() => PostEntity)
  @JoinColumn({ name: 'reply_to_id' })
  replyTo: PostEntity;

  @Column('json', { nullable: true })
  links: Array<string>;
}

class Mention {
  name: string;
  id: string;
}
