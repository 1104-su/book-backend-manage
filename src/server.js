/**
 * 服务启动入口：node src/server.js
 */
require('dotenv').config();
const app = require('./app');

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`图书借阅系统（后台管理）已启动：http://localhost:${port}`);
});
