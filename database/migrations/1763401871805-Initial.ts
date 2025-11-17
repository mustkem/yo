import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1763401871805 implements MigrationInterface {
  name = 'Initial1763401871805';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`passwords\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`user_id\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, UNIQUE INDEX \`REL_72ee375de524a1d87396f4f2a0\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`users\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`username\` varchar(30) NOT NULL, \`email\` varchar(255) NOT NULL, \`name\` varchar(50) NOT NULL, \`avatar\` varchar(255) NULL, \`avatar_key\` varchar(255) NULL, \`bio\` varchar(240) NULL, \`follower_count\` int NOT NULL DEFAULT '0', \`followee_count\` int NOT NULL DEFAULT '0', \`verified\` tinyint NOT NULL DEFAULT 0, UNIQUE INDEX \`IDX_fe0bb3f6520ee0469504521e71\` (\`username\`), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`posts\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`text\` varchar(240) NULL, \`images\` json NULL, \`like_count\` int NOT NULL DEFAULT '0', \`repost_count\` int NOT NULL DEFAULT '0', \`hashtags\` json NULL, \`mentions\` json NULL, \`links\` json NULL, \`author_id\` varchar(36) NULL, \`orig_post_id\` varchar(36) NULL, \`reply_to_id\` varchar(36) NULL, UNIQUE INDEX \`REL_377cc801732eb1c22bab5597c6\` (\`orig_post_id\`), UNIQUE INDEX \`REL_77d932fee463f3a2985034ecec\` (\`reply_to_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`sessions\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`user_id\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`user_followings\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`follower_id\` varchar(36) NULL, \`followee_id\` varchar(36) NULL, UNIQUE INDEX \`following_pair\` (\`follower_id\`, \`followee_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`likes\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`post_id\` varchar(36) NULL, \`user_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`passwords\` ADD CONSTRAINT \`FK_72ee375de524a1d87396f4f2a02\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`posts\` ADD CONSTRAINT \`FK_312c63be865c81b922e39c2475e\` FOREIGN KEY (\`author_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`posts\` ADD CONSTRAINT \`FK_377cc801732eb1c22bab5597c67\` FOREIGN KEY (\`orig_post_id\`) REFERENCES \`posts\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`posts\` ADD CONSTRAINT \`FK_77d932fee463f3a2985034ecec3\` FOREIGN KEY (\`reply_to_id\`) REFERENCES \`posts\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`sessions\` ADD CONSTRAINT \`FK_085d540d9f418cfbdc7bd55bb19\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_followings\` ADD CONSTRAINT \`FK_0cd7f9e9f2d4af466cc095952dc\` FOREIGN KEY (\`follower_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_followings\` ADD CONSTRAINT \`FK_fd3f4cdcd53452ea09ea506eb79\` FOREIGN KEY (\`followee_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`likes\` ADD CONSTRAINT \`FK_741df9b9b72f328a6d6f63e79ff\` FOREIGN KEY (\`post_id\`) REFERENCES \`posts\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`likes\` ADD CONSTRAINT \`FK_3f519ed95f775c781a254089171\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
    await queryRunner.query(`DROP TABLE \`likes\``);
    await queryRunner.query(
      `DROP INDEX \`following_pair\` ON \`user_followings\``,
    );
    await queryRunner.query(`DROP TABLE \`user_followings\``);
    await queryRunner.query(`DROP TABLE \`sessions\``);
    await queryRunner.query(
      `DROP INDEX \`REL_77d932fee463f3a2985034ecec\` ON \`posts\``,
    );
    await queryRunner.query(
      `DROP INDEX \`REL_377cc801732eb1c22bab5597c6\` ON \`posts\``,
    );
    await queryRunner.query(`DROP TABLE \`posts\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_fe0bb3f6520ee0469504521e71\` ON \`users\``,
    );
    await queryRunner.query(`DROP TABLE \`users\``);
    await queryRunner.query(
      `DROP INDEX \`REL_72ee375de524a1d87396f4f2a0\` ON \`passwords\``,
    );
    await queryRunner.query(`DROP TABLE \`passwords\``);
  }
}
