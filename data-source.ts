import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "./src/config/env";
import { Company } from "./src/entities/company.entity";
import { Product } from "./src/entities/product.entity";
import { Batches } from "./src/entities/batches.entity";
import { Code } from "./src/entities/code.entity";
import { AdminFoundationIndexes2026083100010 } from "./migrations/2026083100010-AdminFoundationIndexes";

const dataSource = new DataSource({
  type: "mysql",
  host: env.dbHost,
  port: env.dbPort,
  username: env.dbUsername,
  password: env.dbPassword,
  database: env.dbDatabase,
  entities: [Company, Product, Batches, Code],
  migrations: [AdminFoundationIndexes2026083100010],
  synchronize: false,
  migrationsTransactionMode: "none",
  logging: env.dbLogging,
});

export default dataSource;
