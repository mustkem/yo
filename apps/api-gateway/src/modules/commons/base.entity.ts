import {
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Base entity which is extended by all entities in our application.
 *
 * Features:
 * - UUID primary key
 * - Automatic created_at timestamp
 * - Automatic updated_at timestamp
 * - Soft delete support (deleted_at)
 */
export abstract class YooBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  // @BeforeInsert()
  // ensureId(): void {
  //   // MySQL schema uses char(36) without default; generate UUID in app if missing
  //   if (!this.id) {
  //     this.id = randomUUID();
  //   }
  // }
}
