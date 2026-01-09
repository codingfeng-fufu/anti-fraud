// 云函数：userSignIn
// 用户每日签到功能
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
    const userResult = await db.collection('users').where({
      _openid: openid
    }).get()
    
    if (userResult.data.length === 0) {
      return {
        success: false,
        errMsg: '用户不存在，请先登录'
      }
    }
    
    const user = userResult.data[0]
    
    // 使用北京时间（UTC+8）计算日期
    const now = new Date()
    const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000))
    const today = beijingTime.toISOString().split('T')[0] // YYYY-MM-DD 格式
    
    let lastSignDate = null
    if (user.lastSignDate) {
      const lastDate = new Date(user.lastSignDate)
      const lastBeijingTime = new Date(lastDate.getTime() + (8 * 60 * 60 * 1000))
      lastSignDate = lastBeijingTime.toISOString().split('T')[0]
    }
    
    // 检查今天是否已签到
    if (lastSignDate === today) {
      return {
        success: false,
        errMsg: '今天已经签到过了'
      }
    }
    
    // 计算连续签到天数
    let newSignDays = user.signDays || 0
    const yesterdayDate = new Date(beijingTime.getTime() - 24 * 60 * 60 * 1000)
    const yesterday = yesterdayDate.toISOString().split('T')[0]
    
    if (lastSignDate === yesterday) {
      // 连续签到
      newSignDays += 1
    } else if (lastSignDate !== today) {
      // 断签了，重新开始
      newSignDays = 1
    }
    
    // 计算获得积分（连续签到有加成）
    const basePoints = 10
    const bonusPoints = Math.floor(newSignDays / 7) * 5
    const earnedPoints = basePoints + bonusPoints
    const newPoints = (user.points || 0) + earnedPoints
    
    // 更新用户数据
    await db.collection('users').doc(user._id).update({
      data: {
        signDays: newSignDays,
        points: newPoints,
        lastSignDate: today,  // 保存为 YYYY-MM-DD 字符串格式，与前端保持一致
        updatedAt: new Date()
      }
    })
    
    // 保存签到记录（可选，如果集合不存在会跳过）
    try {
      await db.collection('sign_records').add({
        data: {
          _openid: openid,
          userId: user._id,
          signDate: new Date(),
          points: earnedPoints,
          signDays: newSignDays
        }
      })
    } catch (err) {
      console.log('保存签到记录失败（集合可能不存在）：', err.message)
      // 不影响签到成功，继续执行
    }
    
    // 检查成就（可选，如果集合不存在会跳过）
    try {
      await checkAchievements(openid, user._id, {
        signDays: newSignDays,
        points: newPoints
      })
    } catch (err) {
      console.log('检查成就失败（集合可能不存在）：', err.message)
      // 不影响签到成功，继续执行
    }
    
    return {
      success: true,
      data: {
        signDays: newSignDays,
        points: newPoints,
        earnedPoints,
        lastSignDate: today  // 返回签到日期，用于前端同步
      },
      message: `签到成功！连续签到${newSignDays}天，获得${earnedPoints}积分`
    }
  } catch (err) {
    console.error('签到失败：', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}

// 检查并授予成就
async function checkAchievements(openid, userId, stats) {
  try {
    const achievements = []
    
    // 签到相关成就
    if (stats.signDays === 7) {
      achievements.push({ id: 'sign_7', name: '初来乍到', points: 50 })
    } else if (stats.signDays === 30) {
      achievements.push({ id: 'sign_30', name: '坚持不懈', points: 100 })
    } else if (stats.signDays === 100) {
      achievements.push({ id: 'sign_100', name: '百日勤勉', points: 300 })
    }
    
    // 如果没有达成成就，直接返回
    if (achievements.length === 0) {
      return
    }
    
    // 授予成就
    for (const achievement of achievements) {
      try {
        // 检查是否已获得
        const existResult = await db.collection('user_achievements').where({
          _openid: openid,
          achievementId: achievement.id
        }).get()
        
        if (existResult.data.length === 0) {
          // 未获得，添加成就记录
          await db.collection('user_achievements').add({
            data: {
              _openid: openid,
              userId,
              achievementId: achievement.id,
              achievementName: achievement.name,
              earnedAt: new Date()
            }
          })
          
          // 增加用户积分
          await db.collection('users').doc(userId).update({
            data: {
              points: _.inc(achievement.points),
              achievements: _.push(achievement.id)
            }
          })
          
          console.log(`授予成就成功：${achievement.name}`)
        }
      } catch (err) {
        console.error('授予成就失败：', err.message)
        // 继续处理下一个成就
      }
    }
  } catch (err) {
    console.error('检查成就失败：', err.message)
    // 不抛出错误，避免影响签到功能
  }
}

