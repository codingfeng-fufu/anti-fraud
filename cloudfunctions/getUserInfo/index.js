/**
 * 获取用户信息云函数 - 用户数据管理模块
 * 
 * 上游依赖：微信云开发环境，users数据库集合
 * 入口：exports.main函数，获取用户完整信息
 * 主要功能：从云端数据库获取用户信息，包括积分、成就、称号等
 * 输出：用户完整信息
 * 
 * 重要：每当所属的代码发生变化时，必须对相应的文档进行更新操作！
 */

const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
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
    
    // 获取用户获得的成就详情
    const userAchievementsResult = await db.collection('user_achievements')
      .where({ userId: user._id })
      .get()
    
    // 获取用户拥有的称号
    const userTitles = user.titles || []
    
    // 获取当前佩戴的称号
    const equippedTitleId = user.equippedTitleId || null
    
    return {
      success: true,
      data: {
        openid,
        userInfo: {
          _id: user._id,
          nickName: user.nickName || '未设置',
          avatarUrl: user.avatarUrl || '',
          studentId: user.studentId || '',
          schoolName: user.schoolName || '',
          collegeName: user.collegeName || '',
          majorName: user.majorName || '',
          grade: user.grade || '',
          isBound: user.isBound || false,
          points: user.points || 0,
          signDays: user.signDays || 0,
          totalChatCount: user.totalChatCount || 0,
          totalReadCount: user.totalReadCount || 0,
          continuousLearnDays: user.continuousLearnDays || 0,
          achievements: user.achievements || [],
          titles: userTitles,
          equippedTitleId: equippedTitleId,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        achievements: userAchievementsResult.data,
        titles: userTitles,
        equippedTitleId: equippedTitleId
      }
    }
  } catch (err) {
    console.error('获取用户信息失败：', err)
    return {
      success: false,
      errMsg: err.message || '获取用户信息失败'
    }
  }
}