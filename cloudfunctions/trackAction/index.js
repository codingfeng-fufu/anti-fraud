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
  
  const { action, increment = 1, signDays } = event
  const basePointsMap = {
    chat: 2,
    read: 5
  }
  const basePoints = (basePointsMap[action] || 0) * increment
  
  try {
    const userResult = await db.collection('users')
      .where({ _openid: openid })
      .get()
    
    if (userResult.data.length === 0) {
      return { success: false, errMsg: '用户不存在' }
    }
    
    const user = userResult.data[0]
    
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
        const today = new Date().toISOString().split('T')[0]
        const lastLearnDate = user.lastLearnDate ? new Date(user.lastLearnDate).toISOString().split('T')[0] : null
        
        if (lastLearnDate === today) {
          updateData = {
            continuousLearnDays: user.continuousLearnDays || 0
          }
        } else {
          const expectedNextDay = lastLearnDate ? 
            new Date(new Date(lastLearnDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
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

    const matchedAchievements = (achievementsResult.data || []).filter((achievement) => {
      const target = Number(achievement.target)
      return Number.isFinite(target) && target <= countValue
    })
    
    console.log('查询成就条件:', { action, countValue })
    console.log('找到符合条件的成就数量:', matchedAchievements.length)
    
    const newAchievements = []
    const newAchievementIds = []
    const rewardTitleIds = []
    let achievementPoints = 0
    
    for (const achievement of matchedAchievements) {
      console.log('检查成就:', achievement.achievementId)
      
      const existed = await db.collection('user_achievements')
        .where({
          _openid: openid,
          achievementId: achievement.achievementId
        })
        .count()
      
      console.log(`成就 ${achievement.achievementId} 已获得数量:`, existed.total)
      
      if (existed.total === 0) {
        console.log('授予新成就:', achievement.name, '积分:', achievement.points)
        
        const achievementPointsValue = Number(achievement.points) || 0

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
      }
    }
    
    console.log('成就检查完成:', { 
      newAchievements: newAchievements.length, 
      achievementPoints 
    })
    
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
      rewardUpdate.achievements = _.push(newAchievementIds)
      console.log('准备更新成就列表:', newAchievementIds)
    }
    if (rewardTitleIds.length > 0) {
      rewardUpdate.titles = _.push([...new Set(rewardTitleIds)])
      console.log('准备更新称号列表:', rewardTitleIds)
    }
    
    console.log('rewardUpdate对象:', rewardUpdate)
    
    if (Object.keys(rewardUpdate).length > 0) {
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
