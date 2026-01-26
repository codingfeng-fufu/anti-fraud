// 云函数入口函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

async function ensureCollection(collectionName) {
  try {
    console.log(`检查集合 ${collectionName}...`)
    await db.collection(collectionName).limit(1).get()
    console.log(`集合 ${collectionName} 存在`)
  } catch (err) {
    console.log(`检查集合 ${collectionName} 失败:`, err.message, '错误码:', err.errCode)
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

async function ensureAchievementsData() {
  try {
    const result = await db.collection('achievements').limit(1).get()
    if (result.data.length === 0) {
      console.log('achievements 集合为空，尝试初始化...')
      try {
        const initResult = await cloud.callFunction({
          name: 'initAchievements',
          data: {}
        })
        if (initResult.result && initResult.result.success) {
          console.log('achievements 集合初始化成功:', initResult.result.message)
        } else {
          console.warn('achievements 集合初始化失败:', initResult.result?.message || initResult.result?.errMsg)
        }
      } catch (err) {
        console.error('调用 initAchievements 云函数失败:', err.message)
      }
    }
  } catch (err) {
    console.error('检查 achievements 集合失败:', err.message)
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
  
  console.log('trackAction 收到的参数:', JSON.stringify(event))
  console.log('event.openid:', event.openid)
  console.log('wxContext.OPENID:', wxContext.OPENID)
  
  let openid
  if (event.openid) {
    openid = event.openid
  } else if (wxContext.OPENID) {
    openid = wxContext.OPENID
  }
  
  console.log('最终使用的 openid:', openid)
  
  if (!openid) {
    console.error('openid 为空！event.openid:', event.openid, 'wxContext.OPENID:', wxContext.OPENID)
    return { success: false, errMsg: 'openid 为空' }
  }
  
  const { action, increment = 1, signDays } = event
  console.log('解析的参数:', { action, increment, signDays })
  
  const basePointsMap = {
    chat: 2,
    read: 5
  }
  const basePoints = (basePointsMap[action] || 0) * increment
  
try {
    console.log('开始查询用户...')
    const userResult = await db.collection('users')
      .where({ _openid: openid })
      .get()
    
    console.log('查询到用户数量:', userResult.data.length)
    
if (userResult.data.length === 0) {
      console.error('用户不存在')
      return { success: false, errMsg: '用户不存在' }
    }
    
    const user = userResult.data[0]
    console.log('用户ID:', user._id, '用户昵称:', user.nickName)
    
    console.log('开始检查和创建集合...')
    await ensureCollection('achievements')
    console.log('achievements 集合检查完成')
    await ensureAchievementsData()
    console.log('achievements 数据初始化完成')
    await ensureCollection('user_achievements')
    console.log('user_achievements 集合检查完成')
    await ensureCollection('points_records')
    console.log('points_records 集合检查完成')
    await ensureCollection('sign_records')
    console.log('sign_records 集合检查完成')
    
    let updateData = {}
    let countValue = 0
    
    switch (action) {
      case 'sign':
        countValue = signDays || 0
        break
      case 'chat':
        updateData = {
          totalChatCount: _.inc(increment),
          lastChatDate: new Date()
        }
        countValue = (user.totalChatCount || 0) + increment
        break
      case 'read':
        updateData = {
          totalReadCount: _.inc(increment),
          lastReadDate: new Date()
        }
        countValue = (user.totalReadCount || 0) + increment
        break
      case 'learn':
        const today = formatDateLocal(new Date())
        const lastLearnDate = user.lastLearnDate ? formatDateLocal(new Date(user.lastLearnDate)) : null
        
        if (lastLearnDate === today) {
          updateData = {
            continuousLearnDays: user.continuousLearnDays || 0
          }
        } else {
          const expectedNextDay = lastLearnDate ? 
            formatDateLocal(new Date(new Date(lastLearnDate).getTime() + 24 * 60 * 60 * 1000)) : 
            null
            
          const newContinuousDays = lastLearnDate && expectedNextDay === today ? 
            (user.continuousLearnDays || 0) + 1 : 
            1
            
          updateData = {
            continuousLearnDays: newContinuousDays,
            lastLearnDate: new Date()
          }
        }
        
        countValue = updateData.continuousLearnDays || (user.continuousLearnDays || 0)
        break
      default:
        return { success: false, errMsg: '无效的行为类型' }
    }
    
    if (Object.keys(updateData).length > 0) {
      await db.collection('users').doc(user._id).update({
        data: updateData
      })
    }
    
const achievementsResult = await db.collection('achievements')
      .where({
        type: action,
        isActive: true
      })
      .get()

    console.log('查询到的成就数量:', achievementsResult.data.length)
    console.log('成就列表:', achievementsResult.data.map(a => ({ id: a.achievementId, name: a.name, target: a.target })))

    const matchedAchievements = (achievementsResult.data || []).filter((achievement) => {
      const target = Number(achievement.target)
      return Number.isFinite(target) && target <= countValue
    })
    
console.log('查询成就条件:', { action, countValue })
    console.log('找到符合条件的成就数量:', matchedAchievements.length)
    console.log('符合条件的成就:', matchedAchievements.map(a => ({ id: a.achievementId, name: a.name, target: a.target })))
    
    const newAchievements = []
    const newAchievementIds = []
    const rewardTitleIds = []
    let achievementPoints = 0
    
for (const achievement of matchedAchievements) {
      console.log('检查成就:', achievement.achievementId)
      
      let existedTotal = 0
      try {
        const existed = await db.collection('user_achievements')
          .where({
            _openid: openid,
            achievementId: achievement.achievementId
          })
          .count()
        existedTotal = existed.total
      } catch (err) {
        console.log('查询 user_achievements 失败:', err.message)
      }
      
      console.log(`成就 ${achievement.achievementId} 已获得数量:`, existedTotal)
      
      if (existedTotal === 0) {
        console.log('授予新成就:', achievement.name, '积分:', achievement.points)
        
        const achievementPointsValue = Number(achievement.points) || 0

        try {
          await db.collection('user_achievements').add({
            data: {
              _openid: openid,
              userId: user._id,
              achievementId: achievement.achievementId,
              achievementName: achievement.name,
              earnedAt: new Date(),
              rewardTitleId: achievement.rewardTitleId,
              pointsEarned: achievementPointsValue
            }
          })
          
          newAchievements.push(achievement)
          newAchievementIds.push(achievement.achievementId)
          achievementPoints += achievementPointsValue
          
          console.log('当前成就积分累计:', achievementPoints)
          
          if (achievement.rewardTitleId) {
            rewardTitleIds.push(achievement.rewardTitleId)
          }
        } catch (err) {
          console.error('添加 user_achievements 记录失败:', err.message)
        }
      }
    }
    
console.log('成就检查完成:', { 
      newAchievements: newAchievements.length, 
      newAchievementIds,
      achievementPoints 
    })
    
    console.log('准备更新 users.achievements 字段')
    console.log('当前 achievements 字段:', user.achievements)
    console.log('新成就 IDs:', newAchievementIds)
    
    const totalRewardPoints = basePoints + achievementPoints
    console.log('积分计算:', { basePoints, achievementPoints, totalRewardPoints })
    
    const rewardUpdate = {}
    if (totalRewardPoints > 0) {
      rewardUpdate.points = _.inc(totalRewardPoints)
      console.log('准备更新积分，增加:', totalRewardPoints)
      
      try {
        await db.collection('points_records').add({
          data: {
            _openid: openid,
            userId: user._id,
            type: 'earn',
            points: totalRewardPoints,
            reason: action === 'sign' ? '签到成就' : action === 'chat' ? '对话' : action === 'read' ? '阅读' : '学习',
            relatedId: action === 'sign' ? `achievement_sign_${newAchievementIds.join(',')}` : `${action}_${Date.now()}`,
            createdAt: new Date()
          }
        })
      } catch (err) {
        console.log('保存积分记录失败（集合可能不存在）：', err.message)
      }
    }
if (newAchievementIds.length > 0) {
      const currentAchievements = Array.isArray(user.achievements) ? user.achievements : []
      const mergedAchievements = [...new Set([...currentAchievements, ...newAchievementIds])]
      rewardUpdate.achievements = mergedAchievements
      console.log('准备更新成就列表:', newAchievementIds, '合并后:', mergedAchievements)
      console.log('rewardUpdate.achievements:', rewardUpdate.achievements)
    } else {
      console.log('没有新成就需要添加')
    }
    if (rewardTitleIds.length > 0) {
      const currentTitles = Array.isArray(user.titles) ? user.titles : []
      const mergedTitles = [...new Set([...currentTitles, ...rewardTitleIds])]
      rewardUpdate.titles = mergedTitles
      console.log('准备更新称号列表:', rewardTitleIds, '合并后:', mergedTitles)
    }
    
    console.log('完整的 rewardUpdate 对象:', JSON.stringify(rewardUpdate, null, 2))
    
if (Object.keys(rewardUpdate).length > 0) {
      console.log('开始更新用户数据...')
      console.log('更新内容:', JSON.stringify(rewardUpdate, null, 2))
      await db.collection('users').doc(user._id).update({
        data: rewardUpdate
      })
      console.log('用户数据更新成功')
    } else {
      console.log('没有需要更新的数据')
    }
    
    const finalUserPoints = (user.points || 0) + totalRewardPoints
    console.log('返回数据:', { 
      newAchievements, 
      basePoints, 
      achievementPoints, 
      totalPoints: totalRewardPoints,
      updatedCount: countValue,
      userPoints: finalUserPoints 
    })
    
    return {
      success: true,
      data: {
        newAchievements,
        basePoints,
        achievementPoints,
        totalPoints: totalRewardPoints,
        updatedCount: countValue,
        userPoints: finalUserPoints
      }
    }
  } catch (err) {
    return {
      success: false,
      errMsg: err.message
    }
  }
}
