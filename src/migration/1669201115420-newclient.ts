import {MigrationInterface, QueryRunner} from "typeorm";

export class newclient1669201115420 implements MigrationInterface {
    name = 'newclient1669201115420'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."transaction" ADD "clientId" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "public"."transaction" ADD "appName" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "public"."transaction" ADD "chinagriCommission" bigint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "public"."transaction" ADD "solanaFeeInLamports" bigint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "public"."wallet" ALTER COLUMN "clientId" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."wallet" ALTER COLUMN "clientId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "public"."transaction" DROP COLUMN "solanaFeeInLamports"`);
        await queryRunner.query(`ALTER TABLE "public"."transaction" DROP COLUMN "chinagriCommission"`);
        await queryRunner.query(`ALTER TABLE "public"."transaction" DROP COLUMN "appName"`);
        await queryRunner.query(`ALTER TABLE "public"."transaction" DROP COLUMN "clientId"`);
    }

}
