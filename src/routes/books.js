/**
 * 控制器层（路由）：图书管理全部页面与操作
 * 对应试卷"推荐实现步骤 8"：创建控制器，加入 Service 引用，处理结果与消息并导航到指定页面。
 *
 * 页面导航约定：新增/修改/删除后统一重定向回列表页，通过 msg 查询参数携带
 * "新增成功！/新增失败！/修改成功！/修改失败！/删除成功！/删除失败！"提示，
 * 由列表页以 alert() 弹出（对应试卷图-5、图-7、图-9）。
 */
const express = require('express');
const bookService = require('../services/bookService');

const router = express.Router();

/** 解析路径中的图书ID，非法返回 null */
function parseId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** 构造回列表页的地址（保留查询条件 keyword 和页码 page，对应试卷"返回时保留查询条件和结果"） */
function listUrl(query = {}) {
  const params = new URLSearchParams();
  if (query.keyword) params.set('keyword', query.keyword);
  if (Number(query.page) > 1) params.set('page', query.page);
  const qs = params.toString();
  return qs ? `/?${qs}` : '/';
}

/** 列表行内链接的查询后缀（让"查看/修改"携带当前查询条件和页码；第 1 页不带页码保持 URL 简洁） */
function searchSuffix(keyword, page) {
  const params = new URLSearchParams();
  if (keyword) params.set('keyword', keyword);
  if (Number(page) > 1) params.set('page', page);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/** 把提示信息编码为可安全注入 <script> 的 JS 字面量 */
function toMsgJs(msg) {
  if (!msg) return null;
  return JSON.stringify(String(msg)).replace(/</g, '\\u003c');
}

/** 重定向回列表页并携带提示信息 */
function redirectWithMsg(res, message) {
  res.redirect('/?msg=' + encodeURIComponent(message));
}

// ---------------------------------------------------------------
// 1. 图书信息列表（默认显示全部，按入库时间降序，分页每页 5 条，支持按名称模糊查询）
// ---------------------------------------------------------------
router.get('/', async (req, res, next) => {
  try {
    const result = await bookService.listBooks({
      keyword: req.query.keyword,
      page: req.query.page,
    });
    const suffix = searchSuffix(result.keyword, result.page);
    const books = result.books.map((b) => ({
      ...b,
      viewUrl: `/books/${b.bookId}${suffix}`,
      editUrl: `/books/${b.bookId}/edit${suffix}`,
    }));
    res.render('list', {
      title: '图书借阅系统-后台管理',
      keyword: result.keyword,
      books,
      page: result.page,
      totalPages: result.totalPages,
      total: result.total,
      newUrl: `/books/new${suffix}`,
      msgJs: toMsgJs(req.query.msg),
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------
// 2. 新增图书页面
// ---------------------------------------------------------------
router.get('/books/new', async (req, res, next) => {
  try {
    const types = await bookService.getBookTypes();
    res.render('add', {
      title: '新增图书信息',
      types,
      book: {
        bookCode: '',
        bookName: '',
        bookType: '',
        bookAuthor: '',
        publishPress: '',
        borrowed: 0,                       // 是否借阅默认：未借阅
        createdBy: '系统管理员',            // 入库人默认：系统管理员
        creationTime: bookService.today(), // 入库时间默认：当前时间（日期部分）
      },
      backUrl: listUrl(req.query),
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------
// 3. 新增图书提交
// ---------------------------------------------------------------
router.post('/books', async (req, res) => {
  try {
    const result = await bookService.createBook(req.body);
    redirectWithMsg(res, result.success ? '新增成功！' : '新增失败！');
  } catch (err) {
    console.error('新增图书失败：', err);
    redirectWithMsg(res, '新增失败！');
  }
});

// ---------------------------------------------------------------
// 4. 查看图书详细信息（全部字段只读）
// ---------------------------------------------------------------
router.get('/books/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const book = id ? await bookService.getBook(id) : null;
    if (!book) return res.status(404).send('图书不存在');
    res.render('detail', {
      title: '查看图书信息',
      book,
      backUrl: listUrl(req.query),
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------
// 5. 修改图书页面（入库人、入库时间只读）
// ---------------------------------------------------------------
router.get('/books/:id/edit', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const book = id ? await bookService.getBook(id) : null;
    if (!book) return res.status(404).send('图书不存在');
    const types = await bookService.getBookTypes();
    res.render('edit', {
      title: '修改图书信息',
      types,
      book,
      backUrl: listUrl(req.query),
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------
// 6. 修改图书提交（入库人/入库时间不被表单修改）
// ---------------------------------------------------------------
router.post('/books/:id', async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const result = id ? await bookService.updateBook(id, req.body) : { success: false };
    redirectWithMsg(res, result.success ? '修改成功！' : '修改失败！');
  } catch (err) {
    console.error('修改图书失败：', err);
    redirectWithMsg(res, '修改失败！');
  }
});

// ---------------------------------------------------------------
// 7. 删除图书（页面已 confirm 确认，此处执行删除）
// ---------------------------------------------------------------
router.post('/books/:id/delete', async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const result = id ? await bookService.deleteBook(id) : { success: false };
    redirectWithMsg(res, result.success ? '删除成功！' : '删除失败！');
  } catch (err) {
    console.error('删除图书失败：', err);
    redirectWithMsg(res, '删除失败！');
  }
});

module.exports = router;
