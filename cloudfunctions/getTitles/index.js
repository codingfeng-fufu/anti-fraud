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
    // 获取所有激活的称号
    const allTitles = await db.collection('titles')
      .where({ isActive: true })
      .orderBy('points', 'asc')
      .get()
    
    // 获取用户已获得的称号
    const userResult = await db.collection('users')
      .where({ _openid: openid })
      .get()
    
    const userTitles = userResult.data[0]?.titles || []
    
    // 区分可兑换和已获得的称号
    const titles = allTitles.data.map(title => ({
      ...title,
      owned: userTitles.includes(title.titleId),
      canRedeem: title.type === 'redeem' && !userTitles.includes(title.titleId)
    }))
    
    return {
      success: true,
      data: { titles }
    }
  } catch (err) {
    return {
      success: false,
      errMsg: err.message
    }
  }
}