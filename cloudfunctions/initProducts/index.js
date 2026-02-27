/**
 * 初始化商品数据的云函数
 */

const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

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

const productsData = [
  // 虚拟商品
  {
    id: 'gift_1',
    name: '微信红包封面',
    desc: '限量反诈主题红包封面',
    icon: '🧧',
    points: 100,
    stock: 50,
    category: 'virtual',
    productType: 'virtual',
    limitPerUser: 3,
    isActive: true,
    isHot: true,
    createdAt: new Date()
  },
  {
    id: 'gift_2',
    name: '防诈骗知识手册',
    desc: 'PDF电子版，涵盖常见诈骗类型',
    icon: '📖',
    points: 50,
    stock: 999,
    category: 'virtual',
    productType: 'virtual',
    limitPerUser: 1,
    isActive: true,
    isHot: false,
    createdAt: new Date()
  },
  {
    id: 'gift_3',
    name: '反诈头像框',
    desc: '专属反诈卫士头像框',
    icon: '🖼️',
    points: 80,
    stock: 100,
    category: 'virtual',
    productType: 'virtual',
    limitPerUser: 1,
    isActive: true,
    isHot: true,
    createdAt: new Date()
  },
  
  // 道具卡
  {
    id: 'gift_4',
    name: '补签卡',
    desc: '补签一次签到记录',
    icon: '🎫',
    points: 30,
    stock: 200,
    category: 'tool',
    productType: 'checkin_card',
    limitPerUser: 5,
    isActive: true,
    isHot: false,
    effectDays: 0,
    createdAt: new Date()
  },
  {
    id: 'gift_5',
    name: '双倍积分卡',
    desc: '签到积分翻倍（3天）',
    icon: '✨',
    points: 150,
    stock: 50,
    category: 'tool',
    productType: 'double_points',
    limitPerUser: 1,
    isActive: true,
    isHot: false,
    effectDays: 3,
    createdAt: new Date()
  },
  {
    id: 'gift_6',
    name: '经验加速卡',
    desc: '阅读经验翻倍（7天）',
    icon: '🚀',
    points: 200,
    stock: 30,
    category: 'tool',
    productType: 'exp_boost',
    limitPerUser: 1,
    isActive: true,
    isHot: true,
    effectDays: 7,
    createdAt: new Date()
  },
  
  // 实体商品
  {
    id: 'gift_7',
    name: '学校周边纪念品',
    desc: '学校主题文具套装',
    icon: '🎁',
    points: 500,
    stock: 10,
    category: 'physical',
    productType: 'physical',
    limitPerUser: 1,
    isActive: true,
    isHot: true,
    createdAt: new Date()
  },
  {
    id: 'gift_8',
    name: '校园一卡通充值',
    desc: '10元充值券',
    icon: '💳',
    points: 1000,
    stock: 5,
    category: 'physical',
    productType: 'physical',
    limitPerUser: 1,
    isActive: true,
    isHot: false,
    createdAt: new Date()
  },

  // v3新增：话费/流量（仅记录 + 人工发放）
  {
    id: 'tel_10',
    name: '10元话费充值卡',
    desc: '人工发放：请填写手机号/运营商',
    icon: '📱',
    points: 1200,
    stock: 50,
    category: 'virtual',
    productType: 'mobile_topup',
    fulfillment: 'manual',
    requireRedeemInfo: true,
    limitPerUser: 1,
    isActive: true,
    isHot: true,
    createdAt: new Date()
  },
  {
    id: 'tel_30',
    name: '30元话费充值卡',
    desc: '人工发放：请填写手机号/运营商',
    icon: '📱',
    points: 3200,
    stock: 30,
    category: 'virtual',
    productType: 'mobile_topup',
    fulfillment: 'manual',
    requireRedeemInfo: true,
    limitPerUser: 1,
    isActive: true,
    isHot: false,
    createdAt: new Date()
  },
  {
    id: 'data_10',
    name: '10元流量卡',
    desc: '人工发放：请填写手机号/运营商',
    icon: '📶',
    points: 1200,
    stock: 50,
    category: 'virtual',
    productType: 'data_card',
    fulfillment: 'manual',
    requireRedeemInfo: true,
    limitPerUser: 1,
    isActive: true,
    isHot: false,
    createdAt: new Date()
  },
  {
    id: 'data_30',
    name: '30元流量卡',
    desc: '人工发放：请填写手机号/运营商',
    icon: '📶',
    points: 3200,
    stock: 30,
    category: 'virtual',
    productType: 'data_card',
    fulfillment: 'manual',
    requireRedeemInfo: true,
    limitPerUser: 1,
    isActive: true,
    isHot: false,
    createdAt: new Date()
  },
  {
    id: 'milk_tea_1',
    name: '奶茶券',
    desc: '门店兑换券（口味任选）',
    icon: '🧋',
    points: 300,
    stock: 100,
    category: 'virtual',
    productType: 'coupon',
    fulfillment: 'manual',
    requireRedeemInfo: false,
    limitPerUser: 1,
    isActive: true,
    isHot: true,
    createdAt: new Date()
  }
]

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    await ensureCollection('products')
    await ensureCollection('exchange_records')
    await ensureCollection('user_backpack')
    
    // v3 修复：以 product.id 作为文档主键写入（幂等执行）
    let upserted = 0
    for (const product of productsData) {
      const docId = product.id
      if (!docId) continue
      await db.collection('products').doc(docId).set({
        data: {
          ...product,
          id: docId,
          updatedAt: new Date()
        }
      })
      upserted += 1
    }
    
    return {
      success: true,
      message: `商品数据初始化/更新完成，共写入 ${upserted} 个商品（v3: _id==id）`,
      data: { upserted }
    }
  } catch (err) {
    console.error('初始化商品数据失败:', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}
