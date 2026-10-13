-- =============================================================
-- 图书借阅系统(后台) 数据库初始化脚本
-- 数据库：MySQL 8.0 / 5.7
-- 内容：建库、建表（主键自增）、插入测试数据（每张表不少于 5 条）
-- 用法：mysql -uroot -p < db/init.sql
-- =============================================================

CREATE DATABASE IF NOT EXISTS book_manage DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

USE book_manage;

-- 按外键依赖顺序删除（便于重复导入）
DROP TABLE IF EXISTS book_info;
DROP TABLE IF EXISTS book_type;

-- -------------------------------------------------------------
-- 表 1：图书类型表 book_type
-- -------------------------------------------------------------
CREATE TABLE book_type (
  id       INT         NOT NULL AUTO_INCREMENT COMMENT '图书类型ID（主键，自增）',
  typeName VARCHAR(50) NOT NULL                COMMENT '图书类型名称',
  PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '图书类型表';

-- -------------------------------------------------------------
-- 表 2：图书信息表 book_info
-- -------------------------------------------------------------
CREATE TABLE book_info (
  bookId         INT          NOT NULL AUTO_INCREMENT COMMENT '图书ID（主键，自增）',
  bookCode       VARCHAR(50)  NOT NULL                COMMENT '图书编号',
  bookName       VARCHAR(100) NOT NULL                COMMENT '图书名称',
  bookType       INT          NOT NULL                COMMENT '图书类型（对应 book_type.id）',
  bookAuthor     VARCHAR(50)  NOT NULL                COMMENT '图书作者',
  publishPress   VARCHAR(100) NOT NULL                COMMENT '出版社',
  publishDate    DATE         NOT NULL                COMMENT '出版日期',
  borrowed       INT          NOT NULL DEFAULT 0      COMMENT '是否借阅（1 已借阅，0 未借阅）',
  createdBy      VARCHAR(50)  NOT NULL                COMMENT '入库人',
  creationTime   DATETIME     NOT NULL                COMMENT '入库时间',
  lastUpdatetime DATETIME     NULL                    COMMENT '最新更新时间',
  PRIMARY KEY (bookId),
  CONSTRAINT fk_book_info_type FOREIGN KEY (bookType) REFERENCES book_type (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '图书信息表';

-- -------------------------------------------------------------
-- 测试数据：图书类型表（8 条，对应试卷要求的 8 种图书类型）
-- -------------------------------------------------------------
INSERT INTO book_type (typeName) VALUES
('小说'),
('文学'),
('传记'),
('艺术'),
('少儿'),
('经济'),
('管理'),
('科技');

-- -------------------------------------------------------------
-- 测试数据：图书信息表（8 条，与试卷图-1 的列表数据一致）
-- -------------------------------------------------------------
INSERT INTO book_info
  (bookCode, bookName, bookType, bookAuthor, publishPress, publishDate, borrowed, createdBy, creationTime, lastUpdatetime)
VALUES
  ('BK000023', '企业应用架构模式',    8, '（英）Martin Fowler', '机械工业出版社',     '2014-06-01', 0, '系统管理员', '2014-07-03 09:15:00', NULL),
  ('BK000024', '精通Hibernate',       8, '刘洋',                '电子工业出版社',     '2014-04-10', 1, '系统管理员', '2014-05-03 14:20:00', NULL),
  ('BK000025', '天龙八部',            1, '金庸',                '中原出版社',         '2014-02-15', 0, '系统管理员', '2014-03-12 10:30:00', NULL),
  ('BK000026', '寻找家园',            4, '高尔泰',              '北京十月文艺出版社', '2014-01-20', 0, '系统管理员', '2014-03-01 16:45:00', NULL),
  ('BK000027', '小猫莫格成长系列',    5, '（英）朱迪斯·克尔',   '接力出版社',         '2013-12-01', 1, '系统管理员', '2014-01-01 11:00:00', NULL),
  ('BK000028', '活着',                2, '余华',                '作家出版社',         '2013-10-01', 0, '系统管理员', '2013-11-15 09:00:00', NULL),
  ('BK000029', '国富论',              6, '（英）亚当·斯密',     '商务印书馆',         '2013-08-01', 0, '系统管理员', '2013-09-20 15:30:00', NULL),
  ('BK000030', '德鲁克管理思想精要',  7, '（美）彼得·德鲁克',   '机械工业出版社',     '2013-07-01', 1, '系统管理员', '2013-08-08 10:10:00', NULL);
