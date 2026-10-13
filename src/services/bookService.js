/**
 * 业务逻辑层（Service）：图书业务处理
 * 对应试卷"推荐实现步骤 7"：创建 Service，实现相应业务，并加入 DAO 引用。
 * 职责：参数校验、默认值填充、日期格式化、借阅状态映射、分页计算。
 */
const bookDao = require('../dao/bookDao');
const bookTypeDao = require('../dao/bookTypeDao');

const PAGE_SIZE = 5;                    // 试卷要求：列表每页显示 5 条
const DEFAULT_CREATED_BY = '系统管理员'; // 未实现登录功能，入库人默认"系统管理员"
const DEFAULT_BORROWED = 0;             // 是否借阅默认：0 未借阅

/** 补零（2024-1-5 → 2024-01-05） */
function pad(n) {
  return String(n).padStart(2, '0');
}

/**
 * 格式化为"年-月-日"（YYYY-MM-DD）
 * 兼容数据库字符串（'YYYY-MM-DD' / 'YYYY-MM-DD HH:mm:ss'）、Date 对象与空值
 */
function formatDate(value) {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'string') return value.slice(0, 10);
  if (value instanceof Date) {
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }
  return '';
}

/** 是否借阅状态映射：1 → 已借阅，其它 → 未借阅 */
function borrowedLabel(borrowed) {
  return Number(borrowed) === 1 ? '已借阅' : '未借阅';
}

/** 今天的日期字符串（YYYY-MM-DD），用于新增页"入库时间"默认值 */
function today() {
  return formatDate(new Date());
}

/** 完整的日期时间字符串（YYYY-MM-DD HH:mm:ss），用于"最新更新时间" */
function nowDatetime(now = new Date()) {
  return `${formatDate(now)} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

/**
 * 分页信息计算：
 * - 总页数至少为 1（与试卷图-2"共1页"的表现一致）
 * - 请求页码非法（非数字/越界）时钳制到 [1, totalPages]
 */
function calcPagination(total, page, pageSize = PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  let current = parseInt(page, 10);
  if (!Number.isInteger(current) || current < 1) current = 1;
  if (current > totalPages) current = totalPages;
  return { page: current, totalPages };
}

/**
 * 入库时间规范化：
 * - 'YYYY-MM-DD HH:mm:ss' → 原样返回
 * - 'YYYY-MM-DD'（页面默认值形态）→ 日期 + 当前时分秒，即"默认为当前时间"
 * - 其它 → null（视为校验失败）
 */
function normalizeDatetime(input, now = new Date()) {
  if (!input) return null;
  const value = String(input).trim();
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }
  return null;
}

/** 列表数据装饰：格式化入库时间、映射借阅状态 */
function decorateRow(row) {
  return {
    ...row,
    creationTimeDisplay: formatDate(row.creationTime),
    borrowedLabel: borrowedLabel(row.borrowed),
  };
}

/**
 * 图书列表（分页 + 按名称模糊查询，按入库时间降序）
 * @returns {{books: object[], page: number, totalPages: number, total: number, keyword: string, pageSize: number}}
 */
async function listBooks({ keyword = '', page } = {}) {
  const kw = String(keyword).trim();
  const total = await bookDao.countBooks(kw);
  const { page: current, totalPages } = calcPagination(total, page);
  const rows = await bookDao.findPage({ keyword: kw, page: current, pageSize: PAGE_SIZE });
  return {
    books: rows.map(decorateRow),
    page: current,
    totalPages,
    total,
    keyword: kw,
    pageSize: PAGE_SIZE,
  };
}

/** 查询单本图书（已装饰，不存在返回 null） */
async function getBook(bookId) {
  const row = await bookDao.findById(bookId);
  return row ? decorateRow(row) : null;
}

/** 查询全部图书类型（供新增/修改页下拉框） */
async function getBookTypes() {
  return bookTypeDao.findAll();
}

/**
 * 表单输入 → 图书数据对象（含必填校验与默认值）
 * @param {object} input 表单字段
 * @param {{isUpdate: boolean, existing?: object}} options 修改场景下入库人/入库时间沿用原值
 * @returns {{book?: object, error?: string}}
 */
function buildBookFromInput(input, { isUpdate = false, existing = null } = {}) {
  const now = new Date();
  const src = input || {};

  const book = {
    bookCode: String(src.bookCode || '').trim(),
    bookName: String(src.bookName || '').trim(),
    bookType: Number(src.bookType) || null,
    bookAuthor: String(src.bookAuthor || '').trim(),
    publishPress: String(src.publishPress || '').trim(),
    // 界面无"出版日期"字段（试卷数据库要求非空），新增时默认当前日期
    publishDate: existing ? existing.publishDate : formatDate(now),
    borrowed: src.borrowed === '' || src.borrowed === undefined || src.borrowed === null
      ? DEFAULT_BORROWED
      : Number(src.borrowed),
    // 入库人/入库时间：新增取表单值（默认系统管理员/当前时间）；修改沿用原值（只读不可改）
    createdBy: existing ? existing.createdBy : (String(src.createdBy || '').trim() || DEFAULT_CREATED_BY),
    creationTime: existing ? existing.creationTime : normalizeDatetime(src.creationTime, now),
    lastUpdatetime: isUpdate ? nowDatetime(now) : null,
  };

  // 必填校验（对应试卷：图书编号、图书名称、图书类型、作者、出版社、是否借阅、入库人、入库时间）
  const missing = [];
  if (!book.bookCode) missing.push('图书编号');
  if (!book.bookName) missing.push('图书名称');
  if (!book.bookType) missing.push('图书类型');
  if (!book.bookAuthor) missing.push('作者');
  if (!book.publishPress) missing.push('出版社');
  if (!book.createdBy) missing.push('入库人');
  if (!book.creationTime) missing.push('入库时间');
  if (missing.length) return { error: `以下必填项不能为空或格式不正确：${missing.join('、')}` };

  if (![0, 1].includes(book.borrowed)) return { error: '是否借阅取值不正确' };

  return { book };
}

/** 新增图书 */
async function createBook(input) {
  const { book, error } = buildBookFromInput(input, { isUpdate: false });
  if (error) return { success: false, message: error };
  const bookId = await bookDao.insertBook(book);
  return { success: true, bookId };
}

/** 修改图书（入库人/入库时间不可修改；成功后刷新最新更新时间） */
async function updateBook(bookId, input) {
  const existing = await bookDao.findById(bookId);
  if (!existing) return { success: false, message: '该图书不存在' };
  const { book, error } = buildBookFromInput(input, { isUpdate: true, existing });
  if (error) return { success: false, message: error };
  const affected = await bookDao.updateBook(bookId, book);
  return { success: affected > 0 };
}

/** 删除图书 */
async function deleteBook(bookId) {
  const affected = await bookDao.deleteBook(bookId);
  return { success: affected > 0 };
}

module.exports = {
  PAGE_SIZE,
  formatDate,
  borrowedLabel,
  today,
  calcPagination,
  normalizeDatetime,
  listBooks,
  getBook,
  getBookTypes,
  createBook,
  updateBook,
  deleteBook,
};
