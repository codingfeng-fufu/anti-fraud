/**
 * 商品兑换云函数 - 积分商城模块
 * 
 * 上游依赖：微信云开发环境，products, users, exchange_records, user_backpack数据库集合
 * 入口：exports.main函数，处理商品兑换请求
 * 主要功能：商品兑换、积分扣除、商品发放、库存管理
 * 输出：兑换结果，更新用户数据和背包数据
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
  const openid = wxContext.OPENID || event.openid
  
  console.log('redeemProduct 收到的参数:', event)
  console.log('openid:', openid)
  
  try {
    await ensureCollection('products')
    await ensureCollection('exchange_records')
    await ensureCollection('user_backpack')
    await ensureCollection('points_records')
    
    const { productId } = event
    
    if (!productId) {
      return {
        success: false,
        errMsg: '商品ID不能为空'
      }
    }
    
    // 查找用户
    const userResult = await db.collection('users')
      .where({ _openid: openid })
      .get()
    
    if (userResult.data.length === 0) {
      return {
        success: false,
        errMsg: '用户不存在，请先登录'
      }
    }
    
    const user = userResult.data[0]
    
    // 查找商品
    const productResult = await db.collection('products')
      .doc(productId)
      .get()
    
    if (!productResult.data) {
      return {
        success: false,
        errMsg: '商品不存在'
      }
    }
    
    const product = productResult.data
    
    // 检查商品是否上架
    if (!product.isActive) {
      return {
        success: false,
        errMsg: '商品已下架'
      }
    }
    
    // 检查库存
    if (product.stock <= 0) {
      return {
        success: false,
        errMsg: '商品已售罄'
      }
    }
    
    // 检查积分是否足够
    if (user.points < product.points) {
      return {
        success: false,
        errMsg: `积分不足，需要${product.points}积分，当前${user.points}积分`
      }
    }
    
    // 检查限购
    if (product.limitPerUser > 0) {
      const existingExchangeResult = await db.collection('exchange_records')
        .where({
          _openid: openid,
          productId: productId
        })
        .count()
      
      if (existingExchangeResult.total >= product.limitPerUser) {
        return {
          success: false,
          errMsg: `该商品每人限购${product.limitPerUser}件`
        }
      }
    }
    
    // 开始兑换事务
    const newPoints = user.points - product.points
    const newStock = product.stock - 1
    
    // 扣除积分
    await db.collection('users').doc(user._id).update({
      data: {
        points: newPoints
      }
    })
    
    // 减少库存
    await db.collection('products').doc(productId).update({
      data: {
        stock: newStock
      }
    })
    
    // 添加兑换记录
    const exchangeRecordId = await db.collection('exchange_records').add({
      data: {
        _openid: openid,
        userId: user._id,
        uid: user.uid,
        nickName: user.nickName,
        productId,
        productName: product.name,
        productCategory: product.category,
        productPoints: product.points,
        userPointsBefore: user.points,
        userPointsAfter: newPoints,
        status: 'completed',
        createdAt: new Date()
      }
    })
    
    // 发放商品到背包或立即生效
    if (product.category === 'tool' && product.productType === 'checkin_card') {
      // 补签卡：立即使用，补签一次
      console.log('发放补签卡...')
      try {
        const checkinResult = await cloud.callFunction({
          name: 'userSignIn',
          data: {
            force: true
          }
        })
        console.log('补签卡使用结果:', checkinResult)
      } catch (err) {
        console.error('使用补签卡失败:', err.message)
      }
    } else if (product.category === 'tool' && product.productType === 'double_points') {
      // 双倍积分卡：添加到背包
      const expireDate = new Date()
      expireDate.setDate(expireDate.getDate() + 3) // 3天有效期
      
      await db.collection('user_backpack').add({
        data: {
          _openid: openid,
          userId: user._id,
          uid: user.uid,
          nickName: user.nickName,
          itemId: product.id,
          itemName: product.name,
          itemCategory: product.category,
          itemType: product.productType,
          points: product.points,
          quantity: 1,
          status: 'unused',
          expireAt: expireDate,
          createdAt: new Date()
        }
      })
    } else if (product.category === 'virtual') {
      // 虚拟商品：直接发放
      // 这里可以扩展为红包、头像框等具体发放逻辑
      console.log('发放虚拟商品:', product.name)
    } else if (product.category === 'physical') {
      // 实体商品：添加到背包（待发货）
      await db.collection('user_backpack').add({
        data: {
          _openid: openid,
          userId: user._id,
          uid: user.uid,
          nickName: user.nickName,
          itemId: product.id,
          itemName: product.name,
          itemCategory: product.category,
          itemType: 'physical',
          points: product.points,
          quantity: 1,
          status: 'pending_shipment', // 待发货
          createdAt: new Date()
        }
      })
    }
    
    // 添加积分记录
    try {
      await db.collection('points_records').add({
        data: {
          _openid: openid,
          userId: user._id,
          uid: user.uid,
          nickName: user.nickName,
          type: 'spend',
          points: product.points,
          reason: `兑换商品：${product.name}`,
          relatedId: `exchange_${exchangeRecordId._id}`,
          createdAt: new Date()
        }
      })
    } catch (err) {
      console.log('保存积分记录失败:', err.message)
    }
    
    return {
      success: true,
      data: {
        exchangeId: exchangeRecordId._id,
        newPoints,
        productName: product.name,
        productType: product.productType,
        productCategory: product.category
      },
      message: `兑换成功！花费${product.points}积分`
    }
  } catch (err) {
    console.error('商品兑换失败:', err)
    return {
      success: false,
      errMsg: err.message || '兑换失败，请稍后重试'
    }
  }
}