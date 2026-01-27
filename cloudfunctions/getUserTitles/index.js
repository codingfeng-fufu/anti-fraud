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
  
  try {
    // 获取用户信息
    const userResult = await db.collection('users')
      .where({ _openid: openid })
      .get()
    
    if (userResult.data.length === 0) {
      return { success: false, errMsg: '用户不存在' }
    }
    
    const user = userResult.data[0]
    const userTitleIds = user.titles || []
    const equippedTitleIds = user.equippedTitles || []
    
    // 获取用户拥有的称号详情
    let userTitles = []
    if (userTitleIds.length > 0) {
      try {
        const userTitlesResult = await db.collection('titles')
          .where({
            titleId: _.in(userTitleIds)
          })
          .get()
        userTitles = userTitlesResult.data
      } catch (err) {
        console.error('查询用户称号失败:', err.message)
      }
    }
    
    // 获取用户佩戴的称号详情
    let equippedTitles = []
    if (equippedTitleIds.length > 0) {
      try {
        const equippedTitlesResult = await db.collection('titles')
          .where({
            titleId: _.in(equippedTitleIds)
          })
          .get()
        equippedTitles = equippedTitlesResult.data
      } catch (err) {
        console.error('查询佩戴称号失败:', err.message)
      }
    }
    
    return {
      success: true,
      data: {
        allTitles: userTitles,
        equippedTitles: equippedTitles,
        ownedCount: userTitleIds.length,
        equippedCount: equippedTitleIds.length
      }
    }
  } catch (err) {
    return {
      success: false,
      errMsg: err.message
    }
  }
}