/**
 * 获取兑换记录云函数
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
  
  console.log('getExchangeRecords 收到的参数:', event)
  console.log('openid:', openid)
  
  try {
    await ensureCollection('exchange_records')
    
    const { page = 1, pageSize = 20, status = 'all' } = event
    
    if (!openid) {
      return {
        success: false,
        errMsg: '用户未登录'
      }
    }
    
    // 构建查询条件
    const whereCondition = {
      _openid: openid
    }
    
    if (status && status !== 'all') {
      whereCondition.status = status
    }
    
    // 获取兑换记录总数
    const countResult = await db.collection('exchange_records')
      .where(whereCondition)
      .count()
    
    const total = countResult.total
    
    // 获取兑换记录（分页）
    const skip = (page - 1) * pageSize
    const recordsResult = await db.collection('exchange_records')
      .where(whereCondition)
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()
    
    const records = recordsResult.data || []
    
    // 获取商品详情
    const productIds = [...new Set(records.map(r => r.productId))]
    const productsResult = productIds.length > 0 
      ? await db.collection('products').where({ _id: _.in(productIds) }).get()
      : { data: [] }
    
    const productsMap = new Map(productsResult.data.map(p => [p._id, p]))
    
    // 为每条记录添加商品详情
    const recordsWithProduct = records.map(record => {
      const product = productsMap.get(record.productId)
      return {
        ...record,
        productIcon: product ? product.icon : '',
        productCategory: product ? product.category : ''
      }
    })
    
    return {
      success: true,
      data: {
        records: recordsWithProduct,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    }
  } catch (err) {
    console.error('获取兑换记录失败：', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}