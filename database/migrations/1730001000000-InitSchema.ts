import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1730001000000 implements MigrationInterface {
  name = 'InitSchema1730001000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER DATABASE CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci`,
    );

    await queryRunner.query(`
      CREATE TABLE \`users\` (
        \`id\` char(36) NOT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`username\` varchar(30) NOT NULL,
        \`email\` varchar(255) NOT NULL,
        \`name\` varchar(50) NULL,
        \`avatar\` varchar(255) NULL,
        \`avatar_key\` varchar(255) NULL,
        \`bio\` varchar(240) NULL,
        \`follower_count\` int NOT NULL DEFAULT 0,
        \`followee_count\` int NOT NULL DEFAULT 0,
        \`verified\` tinyint NOT NULL DEFAULT 0,
        UNIQUE INDEX \`UQ_users_username\` (\`username\`),
        UNIQUE INDEX \`UQ_users_email\` (\`email\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`posts\` (
        \`id\` char(36) NOT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`text\` varchar(240) NULL,
        \`images\` json NULL,
        \`author_id\` char(36) NULL,
        \`like_count\` int NOT NULL DEFAULT 0,
        \`repost_count\` int NOT NULL DEFAULT 0,
        \`hashtags\` json NULL,
        \`mentions\` json NULL,
        \`orig_post_id\` char(36) NULL,
        \`reply_to_id\` char(36) NULL,
        \`links\` json NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_posts_author\` (\`author_id\`),
        INDEX \`IDX_posts_orig\` (\`orig_post_id\`),
        INDEX \`IDX_posts_reply\` (\`reply_to_id\`)
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`passwords\` (
        \`id\` char(36) NOT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`user_id\` char(36) NOT NULL,
        \`password\` varchar(255) NOT NULL,
        UNIQUE INDEX \`UQ_passwords_user_id\` (\`user_id\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`likes\` (
        \`id\` char(36) NOT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`post_id\` char(36) NOT NULL,
        \`user_id\` char(36) NOT NULL,
        INDEX \`IDX_likes_post\` (\`post_id\`),
        INDEX \`IDX_likes_user\` (\`user_id\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      ALTER TABLE \`posts\`
        ADD CONSTRAINT \`FK_posts_author\` FOREIGN KEY (\`author_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL,
        ADD CONSTRAINT \`FK_posts_orig\` FOREIGN KEY (\`orig_post_id\`) REFERENCES \`posts\`(\`id\`) ON DELETE SET NULL,
        ADD CONSTRAINT \`FK_posts_reply\` FOREIGN KEY (\`reply_to_id\`) REFERENCES \`posts\`(\`id\`) ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE \`passwords\`
        ADD CONSTRAINT \`FK_passwords_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE \`likes\`
        ADD CONSTRAINT \`FK_likes_post\` FOREIGN KEY (\`post_id\`) REFERENCES \`posts\`(\`id\`) ON DELETE CASCADE,
        ADD CONSTRAINT \`FK_likes_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`likes\` DROP FOREIGN KEY \`FK_likes_user\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`likes\` DROP FOREIGN KEY \`FK_likes_post\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`passwords\` DROP FOREIGN KEY \`FK_passwords_user\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`posts\` DROP FOREIGN KEY \`FK_posts_reply\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`posts\` DROP FOREIGN KEY \`FK_posts_orig\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`posts\` DROP FOREIGN KEY \`FK_posts_author\``,
    );
    await queryRunner.query(`DROP TABLE \`likes\``);
    await queryRunner.query(`DROP TABLE \`passwords\``);
    await queryRunner.query(`DROP TABLE \`posts\``);
    await queryRunner.query(`DROP TABLE \`users\``);
  }
}
