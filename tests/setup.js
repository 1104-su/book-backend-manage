/**
 * Jest 全局初始化脚本
 * - 加载本地 .env（CI 环境下由 workflow 直接注入环境变量，缺失 .env 不影响）
 * - 测试固定使用独立的测试库 book_manage_test，避免污染开发库
 */
require('dotenv').config();

process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'book_manage_test';
