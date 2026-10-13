# 图书借阅系统(后台管理) book-backend-manage

基于《2016年10月学士后Java毕业考试机试试卷-2》「图书借阅系统(后台)」题目，按 quiz07 要求使用 **Express + MySQL** 重新实现的后台管理系统。

## 技术栈

| 项 | 选型 |
|----|------|
| 前后端 | Express 5 + EJS 服务端渲染 |
| 数据库 | MySQL 8（mysql2 连接池） |
| 前端库 | jQuery 1.8.3（试卷指定版本，已本地化） |
| 测试 | Jest + Supertest |
| CI | GitHub Actions（MySQL service container） |

## 功能清单（对应试卷要求）

| # | 功能 | 实现要点 |
|---|------|---------|
| 1 | 图书列表 | 按入库时间（creationTime）降序、日期"年-月-日"、隔行变色、分页每页 5 条 |
| 2 | 查询图书 | 按图书名称模糊查询、输入框保留查询条件、翻页仍保留条件 |
| 3 | 查看详情 | 8 个字段全部只读、返回按钮保留查询条件和页码 |
| 4 | 新增图书 | 类型下拉来自 book_type 表、jQuery 必填校验、入库时间默认当前时间、入库人默认系统管理员、是否借阅默认未借阅、成功/失败 alert 后回列表 |
| 5 | 修改图书 | 入库人/入库时间只读不可改、成功/失败 alert 后回列表、自动刷新最新更新时间 |
| 6 | 删除图书 | confirm("确定删除该图书信息？") 确认后删除、成功/失败 alert 后回列表 |

## 快速开始

```bash
# 1. 准备数据库（MySQL 8）：建库、建表、插入测试数据
mysql -uroot -p < db/init.sql

# 2. 配置环境变量
cp .env.example .env   # 按本地环境修改数据库账号密码（默认库名 book_manage）

# 3. 安装依赖并启动
npm install
npm start              # 访问 http://localhost:3000

# 4. 运行回归测试（自动创建并使用独立测试库 book_manage_test）
npm test
```

## 目录结构（分层：控制器 → 业务 → 数据访问）

```
├── .github/workflows/ci.yml   # GitHub Actions 回归测试
├── db/init.sql                # 建库建表（自增主键）+ 测试数据（每表≥5条）SQL 交付物
├── src/
│   ├── app.js                 # Express 应用装配
│   ├── server.js              # 启动入口
│   ├── config/db.js           # MySQL 连接池
│   ├── dao/                   # 数据访问层：bookDao / bookTypeDao
│   ├── services/              # 业务层：校验/默认值/格式化/分页
│   └── routes/                # 控制器：页面与操作路由
├── views/                     # EJS 页面（列表 / 查看 / 新增 / 修改 + 分页局部）
├── public/                    # 样式与脚本（style.css / main.js / jQuery 1.8.3）
└── tests/                     # 单元 + 集成回归测试
```

## 协作流程

- 使用 GitHub Issues 跟踪前端 / 后端任务（初始化时创建）
- 功能开发走 `feature/*` 分支 → Pull Request → Actions 回归测试通过 → 合并（`Closes #issue`）并删除分支

## 说明

- 试卷数据库表中 `bookAuthor` 标注为"整数"（原文笔误），按界面数据（如"（英）Martin Fowler"）实现为字符串。
- 试卷数据库要求 `publishDate` 非空，但新增/修改界面无此字段，实现为新增时默认取当前日期。
- `是否借阅` 存储 0/1，页面按试卷图显示为"未借阅/已借阅"。
