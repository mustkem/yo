import { UserEntity } from '../../users/users.entity';
import { PostEntity } from '../posts.entity';

export interface CreatePostDto {
  post: Partial<PostEntity>;
  author: UserEntity;
  originalPostId: string;
  replyToPostId: string;
  links: string[];
}
