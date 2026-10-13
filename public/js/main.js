/**
 * 图书借阅系统-后台管理 页面交互脚本（基于 jQuery 1.8.3）
 * 1) 新增/修改表单必填项校验（对应试卷要求：页面中的必填项需要使用 jQuery 做验证）
 * 2) 删除前确认提示（对应试卷图-8：确定删除该图书信息？）
 * 3) 分页"到第 N 页"输入校验
 */
$(function () {
  /** 表单字段 → 中文名称（校验提示用），顺序与页面一致 */
  var FIELD_LABELS = {
    bookCode: '图书编号',
    bookName: '图书名称',
    bookType: '图书类型',
    bookAuthor: '作者',
    publishPress: '出版社',
    borrowed: '是否借阅',
    createdBy: '入库人',
    creationTime: '入库时间'
  };

  // 1) 必填项校验：任一必填项为空则提示并阻止提交
  $('#book-form').on('submit', function () {
    var valid = true;
    $.each(FIELD_LABELS, function (name, label) {
      var $field = $('#book-form [name="' + name + '"]');
      if ($.trim($field.val()) === '') {
        alert(label + '不能为空！');
        $field.focus();
        valid = false;
        return false; // 结束遍历，只提示第一个未填项
      }
    });
    return valid;
  });

  // 2) 删除确认：确认后才提交删除请求
  $('.delete-form').on('submit', function () {
    return confirm('确定删除该图书信息？');
  });

  // 3) 分页跳转校验：页码必须在 1 ~ 总页数之间
  $('.jump-form').on('submit', function () {
    var totalPages = parseInt($(this).attr('data-total-pages'), 10) || 1;
    var value = $.trim($(this).find('.jump-page').val());
    var page = parseInt(value, 10);
    if (value === '' || isNaN(page) || page < 1 || page > totalPages) {
      alert('请输入 1 - ' + totalPages + ' 之间的页码！');
      $(this).find('.jump-page').focus();
      return false;
    }
    return true;
  });
});
