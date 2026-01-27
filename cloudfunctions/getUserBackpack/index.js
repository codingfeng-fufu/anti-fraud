/**
 * 获取用户背包云函数
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
  
  console.log('getUserBackpack 收到的参数:', event)
  console.log('openid:', openid)
  
  try {
    await ensureCollection('user_backpack')
    await ensureCollection('users')
    
    const { category = 'all' } = event
    
    if (!openid) {
      return {
        success: false,
        errMsg: '用户未登录'
      }
    }
    
    // 查找用户
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
    
    // 查找背包物品
    const whereCondition = {
      _openid: openid
    }
    
    if (category && category !== 'all') {
      whereCondition.itemCategory = category
    }
    
    const backpackResult = await db.collection('user_backpack')
      .where(whereCondition)
      .orderBy('createdAt', 'desc')
      .get()
    
    const allItems = backpackResult.data || []
    
    // 处理过期物品
    const now = new Date()
    const validItems = allItems.filter(item => {
      if (!item.expireAt) return true
      const expireDate = new Date(item.expireAt)
      return expireDate > now
    })
    
    // 获取生效中的卡片
    const activeCards = validItems.filter(item => 
      item.itemType === 'double_points' && item.status === 'unused'
    )
    
    return {
      success: true,
      data: {
        backback: validItems,
        activeCards: activeCards,
        total: validItems.length,
        stats: {
          total: validItems.length,
          unused: validItems.filter(i => i.status === 'unused').length,
          active: activeCards.length
        }
      }
    }
  } catch (err) {
    console.error('获取用户背包失败：', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}