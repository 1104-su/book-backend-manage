/**
 * 页面级集成测试：断言页面结构、样式与脚本引用等前端约定
 * （对应试卷图-1 ~ 图-9 的界面还原要求与 jQuery 交互要求）
 */
const request = require('supertest');
const app = require('../../src/app');
const pool = require('../../src/config/db');
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

/** 取响应体文本（兼容 text/* 与 application/javascript 等静态资源响应） */
function bodyOf(res) {
  if (typeof res.text === 'string' && res.text.length) return res.text;
  return res.body ? Buffer.from(res.body).toString('utf8') : '';
}

describe('前端资源与页面结构', () => {
  test('列表页引用样式与脚本，表格具备隔行变色类与分页控件', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('/css/style.css');
    expect(res.text).toContain('/js/jquery-1.8.3.min.js');
    expect(res.text).toContain('/js/main.js');
    expect(res.text).toContain('class="book-table"');
    // 隔行变色
    expect(res.text).toContain('row-even');
    expect(res.text).toContain('row-odd');
    // 分页跳页控件携带总页数（供 jQuery 校验）
    expect(res.text).toContain('data-total-pages="2"');
    expect(res.text).toContain('class="jump-page"');
  });

  test('静态资源可访问且内容正确：style.css / jQuery / main.js', async () => {
    const css = await request(app).get('/css/style.css');
    expect(css.status).toBe(200);
    expect(bodyOf(css)).toContain('.row-odd'); // 隔行变色样式

    const jquery = await request(app).get('/js/jquery-1.8.3.min.js');
    expect(jquery.status).toBe(200);
    expect(bodyOf(jquery)).toContain('jQuery v1.8.3'); // 试卷指定版本

    const main = await request(app).get('/js/main.js');
    expect(main.status).toBe(200);
    expect(bodyOf(main)).toContain('不能为空');
    expect(bodyOf(main)).toContain('确定删除该图书信息？');
  });

  test('新增页：8 个必填标记（红星）与表单挂载点', async () => {
    const res = await request(app).get('/books/new');
    expect(res.status).toBe(200);
    const stars = res.text.match(/class="required"/g) || [];
    expect(stars).toHaveLength(8);
    expect(res.text).toContain('id="book-form"');
  });

  test('修改页：入库人/入库时间为只读灰框（field readonly）', async () => {
    const res = await request(app).get('/books/1/edit');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/class="field readonly" name="createdBy"[^>]*readonly/);
    expect(res.text).toMatch(/class="field readonly" name="creationTime"[^>]*readonly/);
  });

  test('详情页：全部输入框为只读灰框并带返回按钮', async () => {
    const res = await request(app).get('/books/1');
    expect(res.status).toBe(200);
    const inputs = res.text.match(/<input[^>]*>/g) || [];
    expect(inputs.length).toBeGreaterThanOrEqual(7);
    inputs.forEach((tag) => {
      expect(tag).toContain('readonly');
      expect(tag).toContain('class="field readonly"');
    });
    expect(res.text).toContain('返回');
  });
});
