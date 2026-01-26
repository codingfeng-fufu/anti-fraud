/**
 * 用户签到云函数 - 签到积分模块
 * 
 * 上游依赖：微信云开发环境，users数据库集合
 * 入口：exports.main函数，处理签到请求
 * 主要功能：签到逻辑处理、积分计算、连续签到统计、成就检查
 * 输出：签到结果，更新用户数据和签到记录
 * 
 * 重要：每当所属的代码发生变化时，必须对相应的文档进行更新操作！
 */

// 云函数：userSignIn
// 用户每日签到功能
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

const formatDateLocal = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  try {
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
    
    await ensureCollection('sign_records')
    await ensureCollection('points_records')
    await ensureCollection('user_achievements')
    
    const now = new Date()
    const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000))
    const today = formatDateLocal(beijingTime)
    
    const signDates = user.signDates || []
    
    if (signDates.includes(today)) {
      return {
        success: false,
        errMsg: '今天已经签到过了'
      }
    }
    
    const yesterdayDate = new Date(beijingTime.getTime() - 24 * 60 * 60 * 1000)
    const yesterday = formatDateLocal(yesterdayDate)
    
    let consecutiveDays = 1
    if (signDates.length > 0 && signDates[signDates.length - 1] === yesterday) {
      let checkDate = new Date(yesterday)
      consecutiveDays = 1
      
      while (true) {
        checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000)
        const checkDateStr = formatDateLocal(checkDate)
        
        if (signDates.includes(checkDateStr)) {
          consecutiveDays++
        } else {
          break
        }
      }
    }
    
    const basePoints = 10
    const bonusPoints = Math.floor(consecutiveDays / 7) * 5
    const earnedPoints = basePoints + bonusPoints
    const newPoints = (user.points || 0) + earnedPoints
    
    const newSignDates = [...signDates, today]
    
    await db.collection('users').doc(user._id).update({
      data: {
        signDates: newSignDates,
        points: newPoints,
        updatedAt: new Date()
      }
    })
    
    try {
      await db.collection('sign_records').add({
        data: {
          _openid: openid,
          userId: user._id,
          uid: user.uid,
          nickName: user.nickName,
          signDate: new Date(),
          points: earnedPoints,
          signDays: consecutiveDays
        }
      })
    } catch (err) {
      console.log('保存签到记录失败（集合可能不存在）：', err.message)
    }
    
    try {
      await db.collection('points_records').add({
        data: {
          _openid: openid,
          userId: user._id,
          uid: user.uid,
          nickName: user.nickName,
          type: 'earn',
          points: earnedPoints,
          reason: '签到',
          relatedId: `sign_${today}`,
          createdAt: new Date()
        }
      })
    } catch (err) {
      console.log('保存积分记录失败（集合可能不存在）：', err.message)
    }
    
    let achievementRewardPoints = 0
    try {
      const achievementResult = await checkAchievements(openid, user._id, user, {
        signDays: consecutiveDays,
        points: newPoints
      })
      achievementRewardPoints = achievementResult?.rewardPoints || 0
    } catch (err) {
      console.log('检查成就失败（集合可能不存在）：', err.message)
    }
    
let trackActionPoints = 0
    try {
      const trackActionResult = await cloud.callFunction({
        name: 'trackAction',
        data: {
          openid: openid,
          action: 'sign',
          increment: 1,
          signDays: consecutiveDays
        }
      })
      
      if (trackActionResult.result && trackActionResult.result.success) {
        trackActionPoints = trackActionResult.result.data?.totalPoints || 0
      }
      
      console.log('Track sign action result:', trackActionResult)
    } catch (err) {
      console.log('Track sign action failed:', err.message)
    }
    
    const achievementPoints = achievementRewardPoints + trackActionPoints
    const finalPoints = newPoints + achievementPoints
    
    return {
      success: true,
      data: {
        signDays: consecutiveDays,
        signDates: newSignDates,
        points: finalPoints,
        earnedPoints,
        achievementPoints,
        lastSignDate: today
      },
      message: achievementPoints > 0
        ? `签到成功！连续签到${consecutiveDays}天，获得${earnedPoints}积分，成就奖励${achievementPoints}积分`
        : `签到成功！连续签到${consecutiveDays}天，获得${earnedPoints}积分`
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
async function checkAchievements(openid, userId, user, stats) {
  try {
    const achievements = []
    
    if (stats.signDays >= 1) {
      achievements.push({ id: 'sign_1', name: '初来乍到', points: 10 })
    }
    if (stats.signDays >= 7) {
      achievements.push({ id: 'sign_7', name: '坚持不懈', points: 50 })
    }
    if (stats.signDays >= 30) {
      achievements.push({ id: 'sign_30', name: '月度冠军', points: 200 })
    }
    if (stats.signDays >= 100) {
      achievements.push({ id: 'sign_100', name: '百日传奇', points: 1000 })
    }
    
    if (achievements.length === 0) {
      return { rewardPoints: 0, newAchievements: [] }
    }
    
    const newAchievements = []
    let rewardPoints = 0
    
    for (const achievement of achievements) {
      try {
        const existResult = await db.collection('user_achievements').where({
          _openid: openid,
          achievementId: achievement.id
        }).get()
        
        if (existResult.data.length === 0) {
          await db.collection('user_achievements').add({
            data: {
              _openid: openid,
              userId,
              uid: user.uid,
              nickName: user.nickName,
              achievementId: achievement.id,
              achievementName: achievement.name,
              earnedAt: new Date()
            }
          })
          
          await db.collection('users').doc(userId).update({
            data: {
              points: _.inc(achievement.points),
              achievements: _.push(achievement.id)
            }
          })
          
          rewardPoints += achievement.points
          newAchievements.push(achievement)
          console.log(`授予成就成功：${achievement.name}`)
        }
      } catch (err) {
        console.error('授予成就失败：', err.message)
      }
    }
    
    return { rewardPoints, newAchievements }
  } catch (err) {
    console.error('检查成就失败：', err.message)
    return { rewardPoints: 0, newAchievements: [] }
  }
}

