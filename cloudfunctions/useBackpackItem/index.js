/**
 * 使用背包物品云函数
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
  
  console.log('useBackpackItem 收到的参数:', event)
  console.log('openid:', openid)
  
  try {
    await ensureCollection('user_backpack')
    await ensureCollection('users')
    
    const { itemId } = event
    
    if (!itemId) {
      return {
        success: false,
        errMsg: '物品ID不能为空'
      }
    }
    
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
    
    const user = userResult.data[0]
    
    // 查找背包物品
    const itemResult = await db.collection('user_backpack')
      .where({
        _openid: openid,
        _id: itemId,
        status: 'unused'
      })
      .get()
    
    if (itemResult.data.length === 0) {
      return {
        success: false,
        errMsg: '物品不存在或已使用'
      }
    }
    
    const item = itemResult.data[0]
    
    // 处理不同类型的物品
    if (item.itemType === 'checkin_card') {
      // 补签卡：立即使用
      try {
        const signInResult = await cloud.callFunction({
          name: 'userSignIn',
          data: {
            force: true
          }
        })
        
        if (signInResult.result.success) {
          // 更新物品状态为已使用
          await db.collection('user_backpack').doc(item._id).update({
            data: {
              status: 'used',
              usedAt: new Date()
            }
          })
          
          return {
            success: true,
            message: '补签卡使用成功'
          }
        } else {
          return {
            success: false,
            errMsg: signInResult.result.errMsg || '补签卡使用失败'
          }
        }
      } catch (err) {
        console.error('使用补签卡失败:', err.message)
        return {
          success: false,
          errMsg: '补签卡使用失败'
        }
      }
    } else if (item.itemType === 'double_points') {
      // 双倍积分卡：更新状态为生效中
      const expireDate = new Date()
      expireDate.setDate(expireDate.getDate() + 3)
      
      await db.collection('user_backpack').doc(item._id).update({
        data: {
          status: 'active',
          activatedAt: new Date(),
          expireAt: expireDate
        }
      })
      
      return {
        success: true,
        message: '双倍积分卡已激活，接下来3天签到积分翻倍'
      }
    } else if (item.itemCategory === 'virtual') {
      // 虚拟商品：更新状态为已使用
      await db.collection('user_backpack').doc(item._id).update({
        data: {
          status: 'used',
          usedAt: new Date()
        }
      })
      
      return {
        success: true,
        message: `使用${item.itemName}成功`
      }
    } else if (item.itemCategory === 'physical') {
      // 实体商品：更新状态为待发货
      await db.collection('user_backpack').doc(item._id).update({
        data: {
          status: 'pending_shipment',
          usedAt: new Date()
        }
      })
      
      return {
        success: true,
        message: '商品已下单，请联系管理员发货'
      }
    }
    
    return {
      success: true,
      message: '物品使用成功'
    }
  } catch (err) {
    console.error('使用物品失败:', err)
    return {
      success: false,
      errMsg: err.message || '使用物品失败'
    }
  }
}