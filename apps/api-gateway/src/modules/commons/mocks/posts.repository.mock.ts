import { Repository } from 'typeorm';
import { PostEntity } from '../../posts/posts.entity';

export class MockPostsRepository extends Repository<PostEntity> {}
