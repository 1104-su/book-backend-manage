/**
 * 集成测试（回归测试）：以 HTTP 请求方式覆盖试卷要求的 6 大功能
 * 1 列表（降序/分页5条/日期格式） 2 模糊查询（保留条件） 3 查看详情（只读）
 * 4 新增（默认值/校验/提示） 5 修改（只读字段/提示） 6 删除（成功/失败提示）
 */
const request = require('supertest');
const app = require('../../src/app');
const pool = require('../../src/config/db');
const service = require('../../src/services/bookService');
const db = require('../helpers/db');

beforeAll(async () => {
  await db.initSchema();
});

beforeEach(async () => {
  await db.resetData();
});

afterAll(async () => {
  await pool.end();
});

/** 列表页第 1 页应显示的 5 本（入库时间最新） */
const PAGE1_CODES = ['BK100010', 'BK100009', 'BK100008', 'BK100007', 'BK100006'];
/** 列表页第 2 页应显示的 5 本 */
const PAGE2_CODES = ['BK100005', 'BK100004', 'BK100003', 'BK100002', 'BK100001'];

// ---------------------------------------------------------------
describe('功能1：图书列表（按入库时间降序、分页每页5条、日期"年-月-日"、隔行变色）', () => {
  test('默认显示全部图书：表头齐全、降序、每页5条、共2页', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);

    // 表头列
    ['图书编号', '图书分类', '图书名称', '作者', '出版社', '入库时间', '是否借阅', '操作']
      .forEach((h) => expect(res.text).toContain(h));

    // 第 1 页 5 条 + 降序（第 1 条在所有后续记录之前）
    PAGE1_CODES.forEach((code) => expect(res.text).toContain(code));
    expect(res.text).not.toContain('BK100005');
    expect(res.text.indexOf('BK100010')).toBeLessThan(res.text.indexOf('BK100009'));
    expect(res.text.indexOf('BK100009')).toBeLessThan(res.text.indexOf('BK100008'));

    // 日期显示为"年-月-日"（不含时分秒）
    expect(res.text).toContain('2024-01-10');
    expect(res.text).not.toContain('2024-01-10 10:00:00');

    // 隔行变色样式类
    expect(res.text).toContain('row-even');
    expect(res.text).toContain('row-odd');

    // 分页信息
    expect(res.text).toContain('共2页');
    expect(res.text).toContain('上一页');
    expect(res.text).toContain('下一页');
  });

  test('第 2 页显示剩余记录，顺序正确', async () => {
    const res = await request(app).get('/').query({ page: 2 });
    expect(res.status).toBe(200);
    PAGE2_CODES.forEach((code) => expect(res.text).toContain(code));
    expect(res.text).not.toContain('BK100006');
    expect(res.text.indexOf('BK100005')).toBeLessThan(res.text.indexOf('BK100004'));
  });

  test('页码越界 → 显示最后一页；页码非法 → 回退第 1 页', async () => {
    const over = await request(app).get('/').query({ page: 99 });
    expect(over.status).toBe(200);
    expect(over.text).toContain('BK100001');
    expect(over.text).not.toContain('BK100006');

    const invalid = await request(app).get('/').query({ page: 'abc' });
    expect(invalid.status).toBe(200);
    expect(invalid.text).toContain('BK100010');
  });
});

// ---------------------------------------------------------------
describe('功能2：按图书名称模糊查询（保留查询条件）', () => {
  test('模糊匹配"天龙"，结果降序，输入框保留关键字，分页链接保留关键字', async () => {
    const res = await request(app).get('/').query({ keyword: '天龙' });
    expect(res.status).toBe(200);

    // 命中全部 6 本"天龙*"，第 1 页显示最新的 5 本
    ['BK100006', 'BK100005', 'BK100004', 'BK100003', 'BK100002']
      .forEach((code) => expect(res.text).toContain(code));
    expect(res.text).not.toContain('BK100001'); // 第 2 页
    expect(res.text).not.toContain('BK100007'); // 未命中（活着）
    expect(res.text).toContain('共2页');

    // 输入框记忆查询条件
    expect(res.text).toContain('value="天龙"');
    // 分页链接携带查询条件（URL 编码）
    expect(res.text).toContain('keyword=%E5%A4%A9%E9%BE%99');
  });

  test('查询结果翻页仍然保留关键字', async () => {
    const res = await request(app).get('/').query({ keyword: '天龙', page: 2 });
    expect(res.status).toBe(200);
    expect(res.text).toContain('BK100001');
    expect(res.text).not.toContain('BK100006');
    expect(res.text).toContain('value="天龙"');
  });

  test('LIKE 通配符按普通字符处理（% 不会匹配全部）', async () => {
    const res = await request(app).get('/').query({ keyword: '%' });
    expect(res.status).toBe(200);
    expect(res.text).toContain('没有符合条件的图书');
  });
});

// ---------------------------------------------------------------
describe('功能3：查看图书详细信息（全部字段只读、返回保留查询条件）', () => {
  test('详情页展示 8 个字段且全部只读', async () => {
    const res = await request(app).get('/books/10');
    expect(res.status).toBe(200);
    expect(res.text).toContain('查看图书信息');

    expect(res.text).toContain('BK100010');   // 图书编号
    expect(res.text).toContain('围城');        // 图书名称
    expect(res.text).toContain('文学');        // 图书类型
    expect(res.text).toContain('钱锺书');      // 作者
    expect(res.text).toContain('人民文学出版社'); // 出版社
    expect(res.text).toContain('已借阅');      // 是否借阅
    expect(res.text).toContain('系统管理员');  // 入库人
    expect(res.text).toContain('2024-01-10'); // 入库时间

    // 所有输入框均为只读
    const inputs = res.text.match(/<input[^>]*>/g) || [];
    expect(inputs.length).toBeGreaterThanOrEqual(7);
    inputs.forEach((tag) => expect(tag).toContain('readonly'));
    // 是否借阅下拉不可用
    expect(res.text).toContain('disabled');
  });

  test('返回按钮保留查询条件和页码', async () => {
    const res = await request(app).get('/books/1').query({ keyword: '天龙', page: 2 });
    expect(res.status).toBe(200);
    expect(res.text).toContain('/?keyword=%E5%A4%A9%E9%BE%99&amp;page=2');
  });

  test('不存在的图书返回 404', async () => {
    const res = await request(app).get('/books/999');
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------
describe('功能4：新增图书（类型来源 book_type、默认值、校验、提示）', () => {
  test('新增页：类型下拉含全部 8 种、默认值正确（系统管理员/今天/未借阅）', async () => {
    const res = await request(app).get('/books/new');
    expect(res.status).toBe(200);
    expect(res.text).toContain('新增图书信息');
    ['小说', '文学', '传记', '艺术', '少儿', '经济', '管理', '科技']
      .forEach((t) => expect(res.text).toContain(t));
    expect(res.text).toContain('系统管理员');
    expect(res.text).toContain(`value="${service.today()}"`);
    expect(res.text).toMatch(/value="0"\s+selected/); // 未借阅默认选中
  });

  test('提交新增成功：提示"新增成功！"并落库（默认值正确）', async () => {
    const res = await request(app).post('/books').type('form').send({
      bookCode: 'BK900001',
      bookName: '测试图书',
      bookType: '2',
      bookAuthor: '测试作者',
      publishPress: '测试出版社',
      borrowed: '0',
      createdBy: '系统管理员',
      creationTime: service.today(),
    });
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain(encodeURIComponent('新增成功！'));

    // 列表页弹出提示
    const follow = await request(app).get(res.headers.location);
    expect(follow.text).toContain('alert("新增成功！")');

    // 数据库校验：默认值（入库时间=当前时间、出版日期兜底当天、未借阅）
    const [row] = await db.query('SELECT * FROM book_info WHERE bookCode = ?', ['BK900001']);
    expect(row).toBeTruthy();
    expect(row.bookName).toBe('测试图书');
    expect(row.bookType).toBe(2);
    expect(row.borrowed).toBe(0);
    expect(row.createdBy).toBe('系统管理员');
    expect(String(row.creationTime)).toContain(service.today());
    expect(String(row.publishDate)).toBe(service.today());
  });

  test('必填项缺失：提示"新增失败！"且不落库', async () => {
    const res = await request(app).post('/books').type('form').send({
      bookCode: 'BK900002',
      bookName: '', // 图书名称为空
      bookType: '1',
      bookAuthor: '作者',
      publishPress: '出版社',
      borrowed: '0',
      createdBy: '系统管理员',
      creationTime: service.today(),
    });
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain(encodeURIComponent('新增失败！'));
    const rows = await db.query('SELECT * FROM book_info WHERE bookCode = ?', ['BK900002']);
    expect(rows).toHaveLength(0);
  });

  test('图书类型不存在：提示"新增失败！"（外键约束）且不落库', async () => {
    const res = await request(app).post('/books').type('form').send({
      bookCode: 'BK900003',
      bookName: '测试图书3',
      bookType: '999',
      bookAuthor: '作者',
      publishPress: '出版社',
      borrowed: '0',
      createdBy: '系统管理员',
      creationTime: service.today(),
    });
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain(encodeURIComponent('新增失败！'));
    const rows = await db.query('SELECT * FROM book_info WHERE bookCode = ?', ['BK900003']);
    expect(rows).toHaveLength(0);
  });

  test('入库时间格式非法：提示"新增失败！"', async () => {
    const res = await request(app).post('/books').type('form').send({
      bookCode: 'BK900004',
      bookName: '测试图书4',
      bookType: '1',
      bookAuthor: '作者',
      publishPress: '出版社',
      borrowed: '0',
      createdBy: '系统管理员',
      creationTime: '不是日期',
    });
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain(encodeURIComponent('新增失败！'));
  });
});

// ---------------------------------------------------------------
describe('功能5：修改图书（回填、入库人/入库时间只读、提示）', () => {
  test('修改页回填数据，入库人/入库时间为只读', async () => {
    const res = await request(app).get('/books/1/edit');
    expect(res.status).toBe(200);
    expect(res.text).toContain('修改图书信息');
    expect(res.text).toContain('value="BK100001"');
    expect(res.text).toContain('value="天龙八部"');
    expect(res.text).toMatch(/name="createdBy"[^>]*readonly/);
    expect(res.text).toMatch(/name="creationTime"[^>]*readonly/);
  });

  test('提交修改成功：字段更新、入库人/入库时间不可篡改、最新更新时间刷新', async () => {
    const res = await request(app).post('/books/1').type('form').send({
      bookCode: 'BK100001-X',
      bookName: '天龙八部(改)',
      bookType: '2',
      bookAuthor: '金庸',
      publishPress: '新出版社',
      borrowed: '1',
      createdBy: '黑客',                   // 尝试篡改（应被忽略）
      creationTime: '1999-01-01 00:00:00', // 尝试篡改（应被忽略）
    });
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain(encodeURIComponent('修改成功！'));

    const follow = await request(app).get(res.headers.location);
    expect(follow.text).toContain('alert("修改成功！")');

    const [row] = await db.query('SELECT * FROM book_info WHERE bookId = 1');
    expect(row.bookCode).toBe('BK100001-X');
    expect(row.bookName).toBe('天龙八部(改)');
    expect(row.bookType).toBe(2);
    expect(row.publishPress).toBe('新出版社');
    expect(row.borrowed).toBe(1);
    expect(row.createdBy).toBe('系统管理员');             // 未被篡改
    expect(String(row.creationTime)).toBe('2024-01-01 10:00:00'); // 未被篡改
    expect(row.lastUpdatetime).not.toBeNull();             // 最新更新时间已刷新
  });

  test('必填项缺失：提示"修改失败！"，数据保持不变', async () => {
    const res = await request(app).post('/books/1').type('form').send({
      bookCode: 'BK100001',
      bookName: '',
      bookType: '1',
      bookAuthor: '金庸',
      publishPress: '中原出版社',
      borrowed: '0',
      createdBy: '系统管理员',
      creationTime: '2024-01-01',
    });
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain(encodeURIComponent('修改失败！'));
    const [row] = await db.query('SELECT * FROM book_info WHERE bookId = 1');
    expect(row.bookName).toBe('天龙八部'); // 未变
  });

  test('修改不存在的图书：提示"修改失败！"', async () => {
    const res = await request(app).post('/books/999').type('form').send({
      bookCode: 'X', bookName: 'X', bookType: '1', bookAuthor: 'X', publishPress: 'X',
      borrowed: '0', createdBy: '系统管理员', creationTime: '2024-01-01',
    });
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain(encodeURIComponent('修改失败！'));
  });
});

// ---------------------------------------------------------------
describe('功能6：删除图书（成功/失败提示）', () => {
  test('删除成功：记录消失并提示"删除成功！"', async () => {
    const res = await request(app).post('/books/1/delete');
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain(encodeURIComponent('删除成功！'));

    const follow = await request(app).get(res.headers.location);
    expect(follow.text).toContain('alert("删除成功！")');

    const rows = await db.query('SELECT * FROM book_info WHERE bookId = 1');
    expect(rows).toHaveLength(0);
  });

  test('删除不存在的图书：提示"删除失败！"', async () => {
    const res = await request(app).post('/books/999/delete');
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain(encodeURIComponent('删除失败！'));
  });
});
