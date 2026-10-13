# 图书借阅系统(后台管理) book-backend-manage

基于《2016年10月学士后Java毕业考试机试试卷-2》「图书借阅系统(后台)」题目，按 quiz07 要求使用 **Express + MySQL** 重新实现的后台管理系统。

## 技术栈

| 项 | 选型 |
|----|------|
| 前后端 | Express 5 + EJS 服务端渲染 |
| 数据库 | MySQL 8（mysql2 连接池） |
| 前端库 | jQuery 1.8.3（试卷指定版本） |
| 测试 | Jest + Supertest |
| CI | GitHub Actions（MySQL service container） |

## 功能清单

1. 图书列表：按入库时间降序、隔行变色、分页（每页 5 条）
2. 按图书名称模糊查询（保留查询条件）
3. 查看图书详情（只读展示）
4. 新增图书（类型来自 book_type 表，必填校验，成功/失败提示）
5. 修改图书（入库人/入库时间只读，成功/失败提示）
6. 删除图书（confirm 确认，成功/失败提示）

## 快速开始

```bash
# 1. 准备数据库（MySQL 8）
mysql -uroot -p < db/init.sql

# 2. 配置环境变量
cp .env.example .env   # 按本地环境修改数据库账号密码

# 3. 安装依赖并启动
npm install
npm start              # 访问 http://localhost:3000

# 4. 运行回归测试（使用独立测试库 book_manage_test）
npm test
```

## 目录结构

```
├── .github/workflows/ci.yml   # GitHub Actions 回归测试
├── db/init.sql                # 建库建表 + 测试数据（SQL 交付物）
├── src/
│   ├── app.js                 # Express 应用装配
│   ├── server.js              # 启动入口
│   ├── config/db.js           # MySQL 连接池
│   ├── dao/                   # 数据访问层
│   ├── services/              # 业务逻辑层
│   └── routes/                # 控制器（路由）
├── views/                     # EJS 页面模板
├── public/                    # 静态资源（CSS/jQuery）
└── tests/                     # 单元 + 集成测试
```

## 协作流程

- 使用 GitHub Issues 跟踪前端 / 后端任务
- 功能开发走 `feature/*` 分支 → Pull Request → Actions 回归测试通过 → 合并并删除分支
