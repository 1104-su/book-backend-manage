/**
 * 测试数据库工具：
 * - initSchema：确保测试库存在，并复用 db/init.sql 中的建表语句（剔除建库/USE 语句）
 * - resetData：清空业务表并导入 tests/fixtures.sql 固定测试数据
 * - query：直接查询测试库，供测试断言数据库状态
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const DB_NAME = process.env.DB_NAME; // tests/setup.js 已固定为 book_manage_test

function baseConfig(database) {
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database,
    multipleStatements: true,
    dateStrings: true,
  };
}

/** 建库（若不存在）+ 导入表结构 */
async function initSchema() {
  const conn = await mysql.createConnection(baseConfig());
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` DEFAULT CHARACTER SET utf8mb4`);
  await conn.query(`USE \`${DB_NAME}\``);

  const initSql = fs.readFileSync(path.join(__dirname, '..', '..', 'db', 'init.sql'), 'utf8');
  const ddl = initSql
    .replace(/^\s*CREATE DATABASE[^;]*;/gim, '')
    .replace(/^\s*USE\s+[^;]*;/gim, '');
  await conn.query(ddl);
  await conn.end();
}

/** 清空业务表并写入固定测试数据 */
async function resetData() {
  const conn = await mysql.createConnection(baseConfig(DB_NAME));
  const fixtures = fs.readFileSync(path.join(__dirname, '..', 'fixtures.sql'), 'utf8');
  await conn.query('SET FOREIGN_KEY_CHECKS = 0');
  await conn.query('TRUNCATE TABLE book_info');
  await conn.query('TRUNCATE TABLE book_type');
  await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  await conn.query(fixtures);
  await conn.end();
}

/** 直接查询测试库 */
async function query(sql, params = []) {
  const conn = await mysql.createConnection(baseConfig(DB_NAME));
  const [rows] = await conn.query(sql, params);
  await conn.end();
  return rows;
}

module.exports = { initSchema, resetData, query };
