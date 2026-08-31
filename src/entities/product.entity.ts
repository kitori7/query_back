/**
 * 产品实体
 */
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("product")
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  name!: string | null;

  @Column({ type: "int", nullable: true })
  company_id!: number | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  contract_img!: string | null;

  @Column({ type: "int", nullable: true })
  serial_number!: number | null;
}
