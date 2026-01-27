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

// 检查是否有生效的双倍积分卡
async function getActiveDoublePointsCard(openid) {
  try {
    const now = new Date()
    const result = await db.collection('user_backpack')
      .where({
        _openid: openid,
        itemType: 'double_points',
        status: 'active'
      })
      .get()
    
    const cards = result.data || []
    for (const card of cards) {
      if (!card.expireAt) continue
      
      const expireDate = new Date(card.expireAt)
      if (now > expireDate) {
        // 卡已过期，更新状态
        await db.collection('user_backpack').doc(card._id).update({
          data: {
            status: 'expired'
          }
        })
      } else {
        return card
      }
    }
    return null
  } catch (err) {
    console.error('检查双倍积分卡失败:', err.message)
    return null
  }
}

// 检查是否有生效的补签卡
async function getActiveCheckinCard(openid) {
  try {
    const result = await db.collection('user_backpack')
      .where({
        _openid: openid,
        itemType: 'checkin_card',
        status: 'unused'
      })
      .get()
    
    return result.data.length > 0 ? result.data[0] : null
  } catch (err) {
    console.error('检查补签卡失败:', err.message)
    return null
  }
}

// 消费卡片（用于补签卡）
async function consumeCard(openid, cardId, itemType) {
  try {
    const result = await db.collection('user_backpack')
      .where({
        _openid: openid,
        _id: cardId,
        itemType: itemType
      })
      .get()
    
    if (result.data.length > 0) {
      await db.collection('user_backpack').doc(result.data[0]._id).update({
        data: {
          status: 'used',
          usedAt: new Date()
        }
      })
      return true
    }
    return false
  } catch (err) {
    console.error('消费卡片失败:', err.message)
    return false
  }
}

// 检查是否有生效的双倍积分卡
async function getActiveDoublePointsCard(openid) {
  try {
    const now = new Date()
    const result = await db.collection('user_backpack')
      .where({
        _openid: openid,
        itemType: 'double_points',
        status: 'unused'
      })
      .get()
    
    const cards = result.data || []
    for (const card of cards) {
      if (!card.expireAt) continue
      
      const expireDate = new Date(card.expireAt)
      if (now <= expireDate) {
        return card
      }
    }
    return null
  } catch (err) {
    console.error('检查双倍积分卡失败:', err.message)
    return null
  }
}

// 消费卡片（用于补签卡）
async function consumeCard(openid, cardId, itemType) {
  try {
    const result = await db.collection('user_backpack')
      .where({
        _openid: openid,
        _id: cardId,
        itemType: itemType
      })
      .get()
    
    if (result.data.length > 0) {
      await db.collection('user_backpack').doc(result.data[0]._id).update({
        data: {
          status: 'used',
          usedAt: new Date()
        }
      })
      return true
    }
    return false
  } catch (err) {
    console.error('消费卡片失败:', err.message)
    return false
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
    const { force = false } = event
    
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
    await ensureCollection('user_backpack')
    
    const now = new Date()
    const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000))
    const today = formatDateLocal(beijingTime)
    
    const signDates = user.signDates || []
    
    if (!force && signDates.includes(today)) {
      return {
        success: false,
        errMsg: '今天已经签到过了'
      }
    }
    
    const yesterdayDate = new Date(beijingTime.getTime() - 24 * 60 * 60 * 1000)
    const yesterday = formatDateLocal(yesterdayDate)
    
    let consecutiveDays = 1
    if (signDates.length > 0 && (!force || signDates.length > 0)) {
      if (signDates[signDates.length - 1] === yesterday) {
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
    }
    
    // 如果是补签，检查是否有补签卡
    if (force && signDates.length > 0 && !signDates.includes(today)) {
      const checkinCard = await getActiveCheckinCard(openid)
      if (checkinCard) {
        const consumed = await consumeCard(openid, checkinCard._id, 'checkin_card')
        if (consumed) {
          console.log('使用补签卡成功')
        } else {
          return {
            success: false,
            errMsg: '补签卡使用失败'
          }
        }
      }
    }
    
    // 检查是否有生效的双倍积分卡
    let doubleMultiplier = 1
    const doubleCard = await getActiveDoublePointsCard(openid)
    if (doubleCard) {
      doubleMultiplier = 2
      console.log('使用双倍积分卡:', doubleCard.itemName)
    }
    
    const basePoints = 10 * doubleMultiplier
    const bonusPoints = Math.floor(consecutiveDays / 7) * 5 * doubleMultiplier
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
    
    // 如果使用了双倍积分卡，更新卡片使用时间
    if (doubleMultiplier > 1 && doubleCard) {
      await db.collection('user_backpack').doc(doubleCard._id).update({
        data: {
          status: 'used',
          usedAt: new Date()
        }
      })
    }
    
    try {
      await db.collection('sign_records').add({
        data: {
          _openid: openid,
          userId: user._id,
          uid: user.uid,
          nickName: user.nickName,
          signDate: new Date(),
          points: earnedPoints,
          signDays: consecutiveDays,
          doubleUsed: doubleMultiplier > 1
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
          reason: doubleMultiplier > 1 ? `签到（双倍卡x${doubleMultiplier})` : '签到',
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

