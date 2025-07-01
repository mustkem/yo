import { MigrationInterface, QueryRunner } from "typeorm";

export class PostEntity1751389231008 implements MigrationInterface {
    name = 'PostEntity1751389231008'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`posts\` ADD \`links\` json NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`posts\` DROP COLUMN \`links\``);
    }

}
