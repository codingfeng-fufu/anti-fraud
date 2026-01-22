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
  
  const { titleId } = event
  
  try {
    // 获取称号信息
    const titleResult = await db.collection('titles')
      .where({ titleId, isActive: true })
      .get()
    
    if (titleResult.data.length === 0) {
      return {
        success: false,
        errMsg: '称号不存在或已下架'
      }
    }
    
    const title = titleResult.data[0]
    
    if (title.type !== 'redeem') {
      return {
        success: false,
        errMsg: '该称号无法兑换'
      }
    }
    
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
    
    // 检查积分是否足够
    if (user.points < title.points) {
      return {
        success: false,
        errMsg: `积分不足，需要${title.points}积分，当前${user.points}积分`
      }
    }
    
    // 扣除积分并添加称号
    await db.collection('users').doc(user._id).update({
      data: {
        points: _.inc(-title.points),
        titles: _.push(title.titleId)
      }
    })
    
    return {
      success: true,
      message: `成功兑换称号：${title.name}`
    }
  } catch (err) {
    return {
      success: false,
      errMsg: err.message
    }
  }
}