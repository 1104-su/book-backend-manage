/**
 * 数据访问层（DAO）：图书类型表 book_type 的数据库操作
 * 新增/修改页面中的"图书类型"下拉数据必须来源于本表。
 */
const pool = require('../config/db');

/** 查询全部图书类型（按 id 升序） */
async function findAll() {
  const [rows] = await pool.query('SELECT id, typeName FROM book_type ORDER BY id');
  return rows;
}

module.exports = { findAll };
