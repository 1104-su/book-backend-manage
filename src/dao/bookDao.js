/**
 * 数据访问层（DAO）：图书信息表 book_info 的数据库操作
 * 对应试卷"推荐实现步骤 6"：创建数据访问层 DAO，完成所需数据库操作。
 */
const pool = require('../config/db');

// 列表查询统一带出图书类型名称（bookType 关联 book_type 表）
const BASE_SELECT = `
  SELECT b.bookId, b.bookCode, b.bookName, b.bookType, t.typeName,
         b.bookAuthor, b.publishPress, b.publishDate, b.borrowed,
         b.createdBy, b.creationTime, b.lastUpdatetime
  FROM book_info b
  LEFT JOIN book_type t ON b.bookType = t.id
`;

/** 转义 LIKE 通配符（% _ \），避免模糊查询条件被当作通配符解析 */
function escapeLike(keyword) {
  return String(keyword).replace(/[\\%_]/g, (m) => '\\' + m);
}

/**
 * 分页查询图书列表（按入库时间降序，同一时间按 bookId 降序保证顺序稳定）
 * @param {{keyword?: string, page: number, pageSize: number}} options
 */
async function findPage({ keyword, page, pageSize }) {
  const params = [];
  let where = '';
  if (keyword) {
    where = "WHERE b.bookName LIKE CONCAT('%', ?, '%')";
    params.push(escapeLike(keyword));
  }
  const offset = (page - 1) * pageSize;
  const [rows] = await pool.query(
    `${BASE_SELECT} ${where} ORDER BY b.creationTime DESC, b.bookId DESC LIMIT ?, ?`,
    [...params, offset, pageSize]
  );
  return rows;
}

/** 统计图书总数（keyword 为空时统计全部，用于分页总页数计算） */
async function countBooks(keyword) {
  const params = [];
  let where = '';
  if (keyword) {
    where = "WHERE bookName LIKE CONCAT('%', ?, '%')";
    params.push(escapeLike(keyword));
  }
  const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM book_info ${where}`, params);
  return rows[0].total;
}

/** 按主键查询单本图书（带类型名称），不存在返回 null */
async function findById(bookId) {
  const [rows] = await pool.query(`${BASE_SELECT} WHERE b.bookId = ?`, [bookId]);
  return rows.length ? rows[0] : null;
}

/** 新增图书，返回新记录主键 */
async function insertBook(book) {
  const [result] = await pool.query(
    `INSERT INTO book_info
       (bookCode, bookName, bookType, bookAuthor, publishPress, publishDate,
        borrowed, createdBy, creationTime, lastUpdatetime)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    [book.bookCode, book.bookName, book.bookType, book.bookAuthor, book.publishPress,
     book.publishDate, book.borrowed, book.createdBy, book.creationTime]
  );
  return result.insertId;
}

/** 更新图书（入库人/入库时间不可改，最新更新时间由此处写入），返回受影响行数 */
async function updateBook(bookId, book) {
  const [result] = await pool.query(
    `UPDATE book_info
     SET bookCode = ?, bookName = ?, bookType = ?, bookAuthor = ?, publishPress = ?,
         borrowed = ?, lastUpdatetime = ?
     WHERE bookId = ?`,
    [book.bookCode, book.bookName, book.bookType, book.bookAuthor, book.publishPress,
     book.borrowed, book.lastUpdatetime, bookId]
  );
  return result.affectedRows;
}

/** 删除图书，返回受影响行数 */
async function deleteBook(bookId) {
  const [result] = await pool.query('DELETE FROM book_info WHERE bookId = ?', [bookId]);
  return result.affectedRows;
}

module.exports = {
  findPage,
  countBooks,
  findById,
  insertBook,
  updateBook,
  deleteBook,
};
