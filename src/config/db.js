/**
 * 数据库配置：MySQL 连接池（读取 .env 环境变量）
 * 说明：dateStrings: true 让 DATE/DATETIME 以字符串返回（'YYYY-MM-DD' / 'YYYY-MM-DD HH:mm:ss'），
 *      避免时区换算问题，格式化逻辑统一放在业务层处理。
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'book_manage',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
});

module.exports = pool;
