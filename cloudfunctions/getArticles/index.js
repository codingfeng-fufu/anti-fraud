/**
 * 获取文章列表云函数 - 内容管理模块
 * 
 * 上游依赖：微信云开发环境，articles数据库集合
 * 入口：exports.main函数，处理文章列表请求
 * 主要功能：文章列表获取、分类筛选、分页、关键词搜索
 * 输出：文章列表数据，包含总数和分页信息
 * 
 * 重要：每当所属的代码发生变化时，必须对相应的文档进行更新操作！
 */

// 云函数：getArticles
// 获取文章列表，支持分类筛选、分页、搜索
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    const {
      category = '全部',  // 分类
      page = 1,           // 页码
      pageSize = 10,      // 每页数量
      keyword = ''        // 搜索关键词
    } = event

    console.log('getArticles 接收参数：', { category, page, pageSize, keyword })

    // 构建查询条件
    let query = {}

    // 分类筛选
    if (category && category !== '全部') {
      query.category = category
      console.log('添加分类筛选：', category)
    }

    // 关键词搜索
    if (keyword) {
      query.title = db.RegExp({
        regexp: keyword,
        options: 'i'  // 不区分大小写
      })
    }

    console.log('查询条件：', JSON.stringify(query))

    // 查询文章列表（使用 timestamp 排序，因为 publishTime 可能不存在）
    const result = await db.collection('articles')
      .where(query)
      .orderBy('timestamp', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    console.log(`查询结果：找到 ${result.data.length} 篇文章`)

    // 获取总数
    const countResult = await db.collection('articles')
      .where(query)
      .count()

    console.log(`总数：${countResult.total} 篇`)

    return {
      success: true,
      data: {
        list: result.data,
        total: countResult.total,
        page,
        pageSize,
        hasMore: page * pageSize < countResult.total
      }
    }
  } catch (err) {
    console.error('获取文章列表失败：', err)
    return {
      success: false,
      errMsg: err.message,
      data: {
        list: [],
        total: 0,
        hasMore: false
      }
    }
  }
}

