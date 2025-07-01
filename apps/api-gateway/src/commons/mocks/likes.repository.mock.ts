import { Repository } from 'typeorm';
import { LikesEntity } from '../../likes/likes.entity';

export class MockLikesRepository extends Repository<LikesEntity> {}
