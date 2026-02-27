/**
 * 获取商品列表云函数
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
  
  console.log('getProducts 收到的参数:', event)
  console.log('openid:', openid)
  
  try {
    await ensureCollection('products')
    
    const { category = 'all' } = event
    
    const whereCondition = {
      isActive: true
    }
    
    if (category && category !== 'all') {
      whereCondition.category = category
    }
    
    let productsResult = await db.collection('products')
      .where(whereCondition)
      .orderBy('stock', 'asc')
      .get()
    let productRows = productsResult.data || []

    if (productRows.length === 0 || category === 'all') {
      const requiredProductIds = ['tel_10', 'tel_30', 'data_10', 'data_30', 'milk_tea_1']
      const existingIds = new Set(productRows.map(item => item.id || item._id))
      const missing = requiredProductIds.filter(id => !existingIds.has(id))
      if (productRows.length === 0 || (category === 'all' && missing.length > 0)) {
        try {
          await cloud.callFunction({ name: 'initProducts', data: {} })
          productsResult = await db.collection('products')
            .where(whereCondition)
            .orderBy('stock', 'asc')
            .get()
          productRows = productsResult.data || []
        } catch (err) {
          console.warn('initProducts failed:', err?.message || err)
        }
      }
    }
    
    // 检查用户已购买数量
    let purchasedCounts = {}
    if (openid) {
      const userPurchaseResult = await db.collection('exchange_records')
        .where({
          _openid: openid,
          status: 'completed'
        })
        .get()
      
      const userPurchases = userPurchaseResult.data || []
      userPurchases.forEach(record => {
        const productId = record.productId
        purchasedCounts[productId] = (purchasedCounts[productId] || 0) + 1
      })
    }
    
    // 为每个商品添加已购买数量信息
    const products = productRows.map(product => ({
      ...product,
      purchasedCount: purchasedCounts[product.id] || 0,
      // limitPerUser <= 0 视为不限购
      canPurchase: (product.limitPerUser && product.limitPerUser > 0)
        ? ((purchasedCounts[product.id] || 0) < product.limitPerUser)
        : true,
      // 前端兼容字段
      hot: !!product.isHot
    }))
    
    return {
      success: true,
      data: {
        products,
        category,
        total: products.length
      }
    }
  } catch (err) {
    console.error('获取商品列表失败：', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}
