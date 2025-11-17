import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Base entity which is extended by all entities in our application.
 */
export abstract class YooBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // @BeforeInsert()
  // ensureId(): void {
  //   // MySQL schema uses char(36) without default; generate UUID in app if missing
  //   if (!this.id) {
  //     this.id = randomUUID();
  //   }
  // }
}
