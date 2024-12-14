/**
 * 产品实体
 */
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("product")
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  company_id!: number;

  @Column()
  contract_img!: string;

  @Column()
  serial_number!: number;
}
