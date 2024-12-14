/**
 * 公司实体
 */
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("company")
export class Company {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;
}
