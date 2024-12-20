import { createExpressServer } from "routing-controllers";
import { json, urlencoded } from "body-parser";
import "reflect-metadata";
import ds from "./data-source";
import { codeController } from "./src/controllers/code.controller";
import { BatchController } from "./src/controllers/batches.controll";
// cors跨域
const cors = require("cors");
// 可以配置corsOptions 选项，更安全
// 全局挂载

// 新增：初始化 DataSource
ds.initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
  })
  .catch((e: any) => {
    console.log("Error during Data Source initialization:", e);
  });

const app = createExpressServer({
  controllers: [codeController, BatchController],
});

// body 解析相关中间件
// 解析 json 格式
app.use(json());
// 解析 urlencoded body
// 会在 request 对象上挂载 body 属性，包含解析后的数据。
// 这个新的 body 对象包含 key-value 键值对，若设置 extended 为 true，则键值可以是任意累心个，否则只能是字符串或数组。
app.use(urlencoded({ extended: true }));
app.use(cors());

app.listen(3000, () => {
  console.log(`  App is running at http://localhost:3000\n`);
  console.log("  Press CTRL-C to stop\n");
});
