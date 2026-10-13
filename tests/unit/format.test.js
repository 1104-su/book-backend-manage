/**
 * 单元测试：日期格式化、借阅状态映射、分页计算、入库时间规范化
 */
const service = require('../../src/services/bookService');
const pool = require('../../src/config/db');

afterAll(async () => {
  await pool.end();
});

describe('formatDate 日期格式化（年-月-日）', () => {
  test('数据库日期时间字符串 → 截取日期部分', () => {
    expect(service.formatDate('2024-01-05 10:30:00')).toBe('2024-01-05');
  });

  test('数据库日期字符串 → 原样返回', () => {
    expect(service.formatDate('2024-01-05')).toBe('2024-01-05');
  });

  test('Date 对象 → 本地日期', () => {
    expect(service.formatDate(new Date(2024, 0, 5, 10, 30))).toBe('2024-01-05');
  });

  test('空值 → 空字符串', () => {
    expect(service.formatDate(null)).toBe('');
    expect(service.formatDate(undefined)).toBe('');
    expect(service.formatDate('')).toBe('');
  });
});

describe('borrowedLabel 借阅状态映射', () => {
  test('1 → 已借阅', () => {
    expect(service.borrowedLabel(1)).toBe('已借阅');
  });

  test('0 → 未借阅', () => {
    expect(service.borrowedLabel(0)).toBe('未借阅');
  });

  test('其它值 → 未借阅', () => {
    expect(service.borrowedLabel(undefined)).toBe('未借阅');
    expect(service.borrowedLabel(2)).toBe('未借阅');
  });
});

describe('calcPagination 分页计算（每页 5 条）', () => {
  test('总数 10 → 2 页', () => {
    expect(service.calcPagination(10, 1)).toEqual({ page: 1, totalPages: 2 });
  });

  test('无数据 → 至少 1 页', () => {
    expect(service.calcPagination(0, 1)).toEqual({ page: 1, totalPages: 1 });
  });

  test('页码越界 → 钳制到最后一页', () => {
    expect(service.calcPagination(10, 99)).toEqual({ page: 2, totalPages: 2 });
  });

  test('页码非法 → 回退第 1 页', () => {
    expect(service.calcPagination(10, 'abc').page).toBe(1);
    expect(service.calcPagination(10, '-3').page).toBe(1);
    expect(service.calcPagination(10, undefined).page).toBe(1);
  });
});

describe('normalizeDatetime 入库时间规范化', () => {
  test('完整日期时间 → 原样返回', () => {
    expect(service.normalizeDatetime('2024-01-05 09:08:07')).toBe('2024-01-05 09:08:07');
  });

  test('仅日期 → 补充当前时分秒（默认值为当前时间）', () => {
    const now = new Date(2024, 0, 5, 11, 22, 33);
    expect(service.normalizeDatetime('2024-01-05', now)).toBe('2024-01-05 11:22:33');
  });

  test('非法值 → null', () => {
    expect(service.normalizeDatetime('abc')).toBeNull();
    expect(service.normalizeDatetime('')).toBeNull();
    expect(service.normalizeDatetime(undefined)).toBeNull();
  });
});
