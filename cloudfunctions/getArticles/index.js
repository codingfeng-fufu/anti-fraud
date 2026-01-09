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
    
    // 构建查询条件
    let query = {}
    
    // 分类筛选
    if (category && category !== '全部') {
      query.category = category
    }
    
    // 关键词搜索
    if (keyword) {
      query.title = db.RegExp({
        regexp: keyword,
        options: 'i'  // 不区分大小写
      })
    }
    
    // 查询文章列表
    const result = await db.collection('articles')
      .where(query)
      .orderBy('publishTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()
    
    // 获取总数
    const countResult = await db.collection('articles')
      .where(query)
      .count()
    
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

