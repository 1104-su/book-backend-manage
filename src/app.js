/**
 * Express 应用装配（不监听端口，便于 supertest 直接挂载做集成测试）
 */
const path = require('path');
const express = require('express');
const routes = require('./routes/books');

const app = express();

// 视图引擎：EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// 表单解析（application/x-www-form-urlencoded）
app.use(express.urlencoded({ extended: false }));

// 静态资源（CSS、jQuery 等）
app.use(express.static(path.join(__dirname, '..', 'public')));

// 业务路由
app.use('/', routes);

// 404
app.use((req, res) => {
  res.status(404).send('页面不存在');
});

// 统一错误处理
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('服务器内部错误：', err);
  res.status(500).send('服务器内部错误');
});

module.exports = app;
