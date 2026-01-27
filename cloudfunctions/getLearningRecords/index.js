/**
 * 获取学习记录云函数 - 学习记录模块
 * 
 * 上游依赖：微信云开发环境，read_records数据库集合
 * 入口：exports.main函数，处理学习记录请求
 * 主要功能：获取用户阅读历史、阅读统计、学习进度
 * 输出：学习记录列表和统计数据
 * 
 * 重要：每当所属的代码发生变化时，必须对相应的文档进行更新操作！
 */

const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

async function ensureCollection(collectionName) {
  try {
    await db.collection(collectionName).limit(1).get()
  } catch (err) {
    if (err.errCode === -502005) {
      console.log(`集合 ${collectionName} 不存在，尝试创建...`)
      try {
        await db.createCollection(collectionName)
        console.log(`集合 ${collectionName} 创建成功`)
      } catch (createErr) {
        console.error(`创建集合 ${collectionName} 失败:`, createErr.message)
      }
    } else {
      console.error(`检查集合 ${collectionName} 失败:`, err.message)
    }
  }
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  console.log('getLearningRecords 收到的参数:', event)
  console.log('openid:', openid)
  
  try {
    await ensureCollection('read_records')
    
    const { page = 1, pageSize = 20, category } = event
    
    if (!openid) {
      return {
        success: false,
        errMsg: '用户未登录'
      }
    }
    
    // 查找用户ID
    const userResult = await db.collection('users').where({
      _openid: openid
    }).get()
    
    if (userResult.data.length === 0) {
      return {
        success: false,
        errMsg: '用户不存在'
      }
    }
    
    const userId = userResult.data[0]._id
    
    // 构建查询条件
    const whereCondition = {
      _openid: openid
    }
    
    if (category && category !== 'all') {
      whereCondition.articleCategory = category
    }
    
    // 获取阅读记录总数
    const countResult = await db.collection('read_records')
      .where(whereCondition)
      .count()
    
    const total = countResult.total
    
    // 获取阅读记录（分页）
    const skip = (page - 1) * pageSize
    const recordsResult = await db.collection('read_records')
      .where(whereCondition)
      .orderBy('readAt', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()
    
    const records = recordsResult.data || []
    
    // 统计数据
    const statsResult = await db.collection('read_records')
      .where({ _openid: openid })
      .get()
    
    const allRecords = statsResult.data || []
    const totalReadCount = allRecords.length
    const firstReadCount = allRecords.filter(r => r.isFirstRead).length
    
    // 按分类统计
    const categoryStats = {}
    allRecords.forEach(record => {
      const cat = record.articleCategory || '未分类'
      categoryStats[cat] = (categoryStats[cat] || 0) + 1
    })
    
    // 获取最近7天的阅读记录
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentReadCount = allRecords.filter(record => {
      const readDate = new Date(record.readAt)
      return readDate >= sevenDaysAgo
    }).length
    
    // 连续阅读天数
    const readDates = [...new Set(allRecords.map(r => 
      new Date(r.readAt).toISOString().split('T')[0]
    ))].sort()
    
    let consecutiveDays = 0
    if (readDates.length > 0) {
      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      
      if (readDates.includes(today) || readDates.includes(yesterdayStr)) {
        consecutiveDays = 1
        let checkDate = readDates.includes(today) ? 
          new Date() : 
          yesterday
        
        while (true) {
          checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000)
          const checkDateStr = checkDate.toISOString().split('T')[0]
          if (readDates.includes(checkDateStr)) {
            consecutiveDays++
          } else {
            break
          }
        }
      }
    }
    
    return {
      success: true,
      data: {
        records,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        },
        stats: {
          totalReadCount,
          firstReadCount,
          recentReadCount,
          consecutiveDays,
          categoryStats
        }
      }
    }
  } catch (err) {
    console.error('获取学习记录失败：', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}