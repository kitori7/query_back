import path from "path";
import { DataSource } from "typeorm";

const dataSource = new DataSource({
  type: "mysql", // 数据库类型
  host: "159.138.150.5", // mysql 服务地址
  port: 3306, // mysql 服务启动端口
  username: "admin", // mysql 用户名
  password: "zRKYZmSNELzezweB", // mysql 密码
  database: "anti_counterfeiting_db", // 数据库
  entities: [path.join(__dirname, "/../**/*.entity.{js,ts}")], // typeorm 实体
  logging: true, // 开启日志
});

// const dataSource = new DataSource({
//   type: "mysql", // 数据库类型
//   host: "localhost", // mysql 服务地址
//   port: 3306, // mysql 服务启动端口
//   username: "root", // mysql 用户名
//   password: "password", // mysql 密码
//   database: "anti_counterfeiting_db", // 数据库
//   entities: [path.join(__dirname, "/../**/*.entity.{js,ts}")], // typeorm 实体
//   logging: true, // 开启日志
// });

export default dataSource;
