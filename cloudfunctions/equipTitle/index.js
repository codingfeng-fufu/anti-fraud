// 云函数入口函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  const { titleId, action } = event // action: 'equip' or 'unequip'
  
  try {
    // 获取用户信息
    const userResult = await db.collection('users')
      .where({ _openid: openid })
      .get()
    
    if (userResult.data.length === 0) {
      return {
        success: false,
        errMsg: '用户不存在'
      }
    }
    
    const user = userResult.data[0]
    
    if (action === 'equip') {
      // 检查用户是否拥有该称号
      if (!user.titles || !user.titles.includes(titleId)) {
        return {
          success: false,
          errMsg: '您尚未获得此称号'
        }
      }
      
      // 检查是否已经佩戴（避免重复佩戴）
      if (user.equippedTitles && user.equippedTitles.includes(titleId)) {
        return {
          success: true,
          message: '称号已佩戴'
        }
      }
      
      // 限制最多佩戴3个称号
      if (!user.equippedTitles) user.equippedTitles = []
      if (user.equippedTitles.length >= 3) {
        return {
          success: false,
          errMsg: '最多只能佩戴3个称号'
        }
      }
      
      // 添加到佩戴称号列表
      await db.collection('users').doc(user._id).update({
        data: {
          equippedTitles: _.push(titleId)
        }
      })
      
      return {
        success: true,
        message: '称号佩戴成功'
      }
    } else if (action === 'unequip') {
      // 从佩戴称号列表中移除
      if (!user.equippedTitles || !user.equippedTitles.includes(titleId)) {
        return {
          success: true,
          message: '称号未佩戴'
        }
      }
      
      await db.collection('users').doc(user._id).update({
        data: {
          equippedTitles: _.pull(titleId)
        }
      })
      
      return {
        success: true,
        message: '称号卸下成功'
      }
    } else {
      return {
        success: false,
        errMsg: '无效的操作类型'
      }
    }
  } catch (err) {
    return {
      success: false,
      errMsg: err.message
    }
  }
}