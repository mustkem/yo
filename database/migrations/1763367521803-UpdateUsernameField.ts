import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUsernameField1763367521803 implements MigrationInterface {
  name = 'UpdateUsernameField1763367521803';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`sessions\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`user_id\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`user_followings\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`follower_id\` varchar(36) NULL, \`followee_id\` varchar(36) NULL, UNIQUE INDEX \`following_pair\` (\`follower_id\`, \`followee_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX \`REL_72ee375de524a1d87396f4f2a0\` ON \`passwords\` (\`user_id\`)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`REL_377cc801732eb1c22bab5597c6\` ON \`posts\` (\`orig_post_id\`)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`REL_77d932fee463f3a2985034ecec\` ON \`posts\` (\`reply_to_id\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`likes\` DROP FOREIGN KEY \`FK_3f519ed95f775c781a254089171\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`likes\` DROP FOREIGN KEY \`FK_741df9b9b72f328a6d6f63e79ff\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_followings\` DROP FOREIGN KEY \`FK_fd3f4cdcd53452ea09ea506eb79\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_followings\` DROP FOREIGN KEY \`FK_0cd7f9e9f2d4af466cc095952dc\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`sessions\` DROP FOREIGN KEY \`FK_085d540d9f418cfbdc7bd55bb19\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`posts\` DROP FOREIGN KEY \`FK_77d932fee463f3a2985034ecec3\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`posts\` DROP FOREIGN KEY \`FK_377cc801732eb1c22bab5597c67\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`posts\` DROP FOREIGN KEY \`FK_312c63be865c81b922e39c2475e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`passwords\` DROP FOREIGN KEY \`FK_72ee375de524a1d87396f4f2a02\``,
    );
    await queryRunner.query(
      `DROP INDEX \`REL_77d932fee463f3a2985034ecec\` ON \`posts\``,
    );
    await queryRunner.query(
      `DROP INDEX \`REL_377cc801732eb1c22bab5597c6\` ON \`posts\``,
    );
    await queryRunner.query(
      `DROP INDEX \`REL_72ee375de524a1d87396f4f2a0\` ON \`passwords\``,
    );
    await queryRunner.query(`ALTER TABLE \`likes\` DROP COLUMN \`user_id\``);
    await queryRunner.query(
      `ALTER TABLE \`likes\` ADD \`user_id\` char(36) NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE \`likes\` DROP COLUMN \`post_id\``);
    await queryRunner.query(
      `ALTER TABLE \`likes\` ADD \`post_id\` char(36) NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE \`likes\` DROP COLUMN \`updated_at\``);
    await queryRunner.query(
      `ALTER TABLE \`likes\` ADD \`updated_at\` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE \`likes\` DROP COLUMN \`created_at\``);
    await queryRunner.query(
      `ALTER TABLE \`likes\` ADD \`created_at\` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE \`likes\` DROP COLUMN \`id\``);
    await queryRunner.query(
      `ALTER TABLE \`likes\` ADD \`id\` char(36) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`posts\` DROP INDEX \`IDX_77d932fee463f3a2985034ecec\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`posts\` DROP COLUMN \`reply_to_id\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`posts\` ADD \`reply_to_id\` char(36) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`posts\` DROP INDEX \`IDX_377cc801732eb1c22bab5597c6\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`posts\` DROP COLUMN \`orig_post_id\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`posts\` ADD \`orig_post_id\` char(36) NULL`,
    );
    await queryRunner.query(`ALTER TABLE \`posts\` DROP COLUMN \`author_id\``);
    await queryRunner.query(
      `ALTER TABLE \`posts\` ADD \`author_id\` char(36) NULL`,
    );
    await queryRunner.query(`ALTER TABLE \`posts\` DROP COLUMN \`updated_at\``);
    await queryRunner.query(
      `ALTER TABLE \`posts\` ADD \`updated_at\` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE \`posts\` DROP COLUMN \`created_at\``);
    await queryRunner.query(
      `ALTER TABLE \`posts\` ADD \`created_at\` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE \`posts\` DROP COLUMN \`id\``);
    await queryRunner.query(
      `ALTER TABLE \`posts\` ADD \`id\` char(36) NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE \`posts\` ADD PRIMARY KEY (\`id\`)`);
    await queryRunner.query(
      `ALTER TABLE \`users\` DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` DROP INDEX \`IDX_fe0bb3f6520ee0469504521e71\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` CHANGE \`username\` \`username\` varchar(30) NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`updated_at\``);
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`updated_at\` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`created_at\``);
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`created_at\` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`id\``);
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`id\` char(36) NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE \`users\` ADD PRIMARY KEY (\`id\`)`);
    await queryRunner.query(
      `ALTER TABLE \`passwords\` DROP INDEX \`IDX_72ee375de524a1d87396f4f2a0\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`passwords\` DROP COLUMN \`user_id\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`passwords\` ADD \`user_id\` char(36) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`passwords\` DROP COLUMN \`updated_at\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`passwords\` ADD \`updated_at\` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE \`passwords\` DROP COLUMN \`created_at\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`passwords\` ADD \`created_at\` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE \`passwords\` DROP COLUMN \`id\``);
    await queryRunner.query(
      `ALTER TABLE \`passwords\` ADD \`id\` char(36) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`passwords\` ADD PRIMARY KEY (\`id\`)`,
    );
    await queryRunner.query(
      `DROP INDEX \`following_pair\` ON \`user_followings\``,
    );
    await queryRunner.query(`DROP TABLE \`user_followings\``);
    await queryRunner.query(`DROP TABLE \`sessions\``);
    await queryRunner.query(
      `CREATE INDEX \`IDX_likes_user\` ON \`likes\` (\`user_id\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_likes_post\` ON \`likes\` (\`post_id\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_posts_reply\` ON \`posts\` (\`reply_to_id\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_posts_orig\` ON \`posts\` (\`orig_post_id\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_posts_author\` ON \`posts\` (\`author_id\`)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`UQ_users_username\` ON \`users\` (\`username\`)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`UQ_users_email\` ON \`users\` (\`email\`)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`UQ_passwords_user_id\` ON \`passwords\` (\`user_id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`likes\` ADD CONSTRAINT \`FK_likes_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`likes\` ADD CONSTRAINT \`FK_likes_post\` FOREIGN KEY (\`post_id\`) REFERENCES \`posts\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`posts\` ADD CONSTRAINT \`FK_posts_reply\` FOREIGN KEY (\`reply_to_id\`) REFERENCES \`posts\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`posts\` ADD CONSTRAINT \`FK_posts_orig\` FOREIGN KEY (\`orig_post_id\`) REFERENCES \`posts\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`posts\` ADD CONSTRAINT \`FK_posts_author\` FOREIGN KEY (\`author_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`passwords\` ADD CONSTRAINT \`FK_passwords_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
