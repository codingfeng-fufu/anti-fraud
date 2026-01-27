/**
 * 清空用户数据云函数 - 数据管理模块
 * 
 * 上游依赖：微信云开发环境，users, user_achievements, bind_logs等数据库集合
 * 入口：exports.main函数，清空指定用户的所有数据
 * 主要功能：清空用户的所有云端数据，包括用户信息、成就、绑定记录等
 * 输出：清空结果
 * 
 * 重要：此操作不可逆，请谨慎使用！
 * 重要：每当所属的代码发生变化时，必须对相应的文档进行更新操作！
 */

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
    console.log('开始清空用户数据，openid:', openid)
    
    // 1. 获取用户信息
    const userResult = await db.collection('users')
      .where({ _openid: openid })
      .get()
    
    if (userResult.data.length === 0) {
      return {
        success: false,
        errMsg: '用户不存在'
      }
    }
    
    const userId = userResult.data[0]._id
    const deletedData = {
      user: null,
      userAchievements: 0,
      bindLogs: 0
    }
    
    // 2. 删除用户成就记录
    const achievementsResult = await db.collection('user_achievements')
      .where({ userId: userId })
      .remove()
    deletedData.userAchievements = achievementsResult.stats.removed || 0
    console.log('删除用户成就记录:', deletedData.userAchievements, '条')
    
    // 3. 删除绑定日志
    const bindLogsResult = await db.collection('bind_logs')
      .where({ _openid: openid })
      .remove()
    deletedData.bindLogs = bindLogsResult.stats.removed || 0
    console.log('删除绑定日志:', deletedData.bindLogs, '条')
    
    // 4. 重置用户数据（保留基本信息，清空业务数据）
    const resetData = {
      points: 0,
      signDays: 0,
      lastSignDate: null,
      totalChatCount: 0,
      lastChatDate: null,
      totalReadCount: 0,
      lastReadDate: null,
      continuousLearnDays: 0,
      lastLearnDate: null,
      achievements: [],
      titles: [],
      equippedTitleId: null,
      studentId: '',
      schoolId: '',
      schoolName: '',
      collegeId: '',
      collegeName: '',
      majorId: '',
      majorName: '',
      grade: '',
      className: '',
      phone: '',
      realName: '',
      isBound: false,
      verifiedAt: null,
      updatedAt: new Date()
    }
    
    await db.collection('users').doc(userId).update({
      data: resetData
    })
    
    deletedData.user = {
      _id: userId,
      ...resetData
    }
    console.log('重置用户数据成功')
    
    // 5. 获取重置后的用户信息
    const updatedUser = await db.collection('users').doc(userId).get()
    
    return {
      success: true,
      data: {
        deletedData,
        userInfo: updatedUser.data
      },
      message: '数据清空成功'
    }
  } catch (err) {
    console.error('清空用户数据失败：', err)
    return {
      success: false,
      errMsg: err.message || '清空数据失败，请重试'
    }
  }
}