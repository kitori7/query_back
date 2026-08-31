import type { MigrationInterface, QueryRunner } from "typeorm";

type CountRow = { count: string | number };

export class AdminFoundationIndexes202608310001 implements MigrationInterface {
  name = "AdminFoundationIndexes202608310001";
  transaction = false;

  private async assertZero(queryRunner: QueryRunner, sql: string, label: string): Promise<void> {
    const rows = (await queryRunner.query(sql)) as CountRow[];
    if (Number(rows[0]?.count ?? 0) !== 0) {
      throw new Error(`Migration precheck failed: ${label}`);
    }
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.assertZero(queryRunner, "SELECT COUNT(*) AS count FROM company WHERE name IS NULL OR TRIM(name) = ''", "company name");
    await this.assertZero(queryRunner, "SELECT COUNT(*) AS count FROM (SELECT name FROM company GROUP BY name HAVING COUNT(*) > 1) duplicate_company", "duplicate company name");
    await this.assertZero(queryRunner, "SELECT COUNT(*) AS count FROM product p LEFT JOIN company c ON c.id = p.company_id WHERE p.name IS NULL OR TRIM(p.name) = '' OR p.company_id IS NULL OR c.id IS NULL", "product parent/name");
    await this.assertZero(queryRunner, "SELECT COUNT(*) AS count FROM (SELECT company_id, name FROM product GROUP BY company_id, name HAVING COUNT(*) > 1) duplicate_product", "duplicate product name");
    await this.assertZero(queryRunner, "SELECT COUNT(*) AS count FROM batches b LEFT JOIN product p ON p.id = b.product_id WHERE b.name IS NULL OR TRIM(b.name) = '' OR b.product_id IS NULL OR p.id IS NULL", "batch parent/name");
    await queryRunner.query("SELECT COUNT(*) AS count FROM (SELECT product_id, name FROM batches GROUP BY product_id, name HAVING COUNT(*) > 1) duplicate_batch");
    await this.assertZero(queryRunner, "SELECT COUNT(*) AS count FROM code c LEFT JOIN batches b ON b.id = c.batches_id WHERE c.code_uuid IS NULL OR TRIM(c.code_uuid) = '' OR c.url IS NULL OR TRIM(c.url) = '' OR c.batches_id IS NULL OR b.id IS NULL", "code parent/value");
    await this.assertZero(queryRunner, "SELECT COUNT(*) AS count FROM (SELECT code_uuid FROM code GROUP BY code_uuid HAVING COUNT(*) > 1) duplicate_code", "duplicate code uuid");

    await queryRunner.query("ALTER TABLE company ADD UNIQUE INDEX uq_company_name (name), ALGORITHM=INPLACE, LOCK=NONE");
    await queryRunner.query("ALTER TABLE product ADD UNIQUE INDEX uq_product_company_name (company_id, name), ALGORITHM=INPLACE, LOCK=NONE");
    await queryRunner.query("ALTER TABLE batches ADD COLUMN uniqueness_enforced TINYINT NULL DEFAULT NULL");
    await queryRunner.query("ALTER TABLE batches ADD UNIQUE INDEX uq_batches_product_name_enforced (product_id, name, uniqueness_enforced), ALGORITHM=INPLACE, LOCK=NONE");
    await queryRunner.query("ALTER TABLE code ADD UNIQUE INDEX uq_code_uuid (code_uuid), ALGORITHM=INPLACE, LOCK=NONE");
    await queryRunner.query("ALTER TABLE code ADD INDEX idx_code_batches_id_id (batches_id, id), ALGORITHM=INPLACE, LOCK=NONE");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE code DROP INDEX idx_code_batches_id_id");
    await queryRunner.query("ALTER TABLE code DROP INDEX uq_code_uuid");
    await queryRunner.query("ALTER TABLE batches DROP INDEX uq_batches_product_name_enforced");
    await queryRunner.query("ALTER TABLE batches DROP COLUMN uniqueness_enforced");
    await queryRunner.query("ALTER TABLE product DROP INDEX uq_product_company_name");
    await queryRunner.query("ALTER TABLE company DROP INDEX uq_company_name");
  }
}
