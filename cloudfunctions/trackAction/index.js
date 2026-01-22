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
  
  const { action, increment = 1 } = event // action: 'sign', 'chat', 'read', 'learn'
  
  try {
    // 获取用户信息
    const userResult = await db.collection('users')
      .where({ _openid: openid })
      .get()
    
    if (userResult.data.length === 0) {
      return { success: false, errMsg: '用户不存在' }
    }
    
    const user = userResult.data[0]
    
    // 根据不同行为类型更新用户数据
    let updateData = {}
    let countValue = 0
    
    switch (action) {
      case 'sign':
        // 签到行为不需要额外更新用户数据，因为已经在userSignIn中处理
        // 但我们仍需要检查是否有相关的成就
        countValue = (user.signDays || 0) + increment
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
        // 检查是否是同一天学习
        const today = new Date().toISOString().split('T')[0]
        const lastLearnDate = user.lastLearnDate ? new Date(user.lastLearnDate).toISOString().split('T')[0] : null
        
        if (lastLearnDate === today) {
          // 今天已经学习过，只增加计数，不增加连续天数
          updateData = {
            continuousLearnDays: user.continuousLearnDays || 0
          }
        } else {
          // 新的一天学习，更新连续学习天数
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
    
    // 如果需要更新用户数据，则执行更新
    if (Object.keys(updateData).length > 0) {
      await db.collection('users').doc(user._id).update({
        data: updateData
      })
    }
    
    // 更新用户统计信息
    await db.collection('users').doc(user._id).update({
      data: updateData
    })
    
    // 检查并授予成就
    const achievementsResult = await db.collection('achievements')
      .where({
        type: action,
        target: _.lte(countValue), // 目标值小于等于当前值
        isActive: true
      })
      .get()
    
    const newAchievements = []
    
    for (const achievement of achievementsResult.data) {
      // 检查是否已获得
      const existed = await db.collection('user_achievements')
        .where({
          _openid: openid,
          achievementId: achievement.achievementId
        })
        .count()
      
      if (existed.total === 0) {
        // 授予新成就
        await db.collection('user_achievements').add({
          data: {
            _openid: openid,
            userId: user._id,
            achievementId: achievement.achievementId,
            achievementName: achievement.name,
            earnedAt: new Date(),
            rewardTitleId: achievement.rewardTitleId,
            pointsEarned: achievement.points
          }
        })
        
        newAchievements.push(achievement)
        
        // 添加称号到用户
        if (achievement.rewardTitleId) {
          await db.collection('users').doc(user._id).update({
            data: {
              titles: _.push(achievement.rewardTitleId)
            }
          })
        }
      }
    }
    
    // 更新用户积分
    if (newAchievements.length > 0) {
      const totalRewardPoints = newAchievements.reduce(
        (sum, ach) => sum + ach.points, 0
      )
      
      await db.collection('users').doc(user._id).update({
        data: {
          points: _.inc(totalRewardPoints)
        }
      })
    }
    
    return {
      success: true,
      data: {
        newAchievements,
        totalPoints: newAchievements.reduce((sum, ach) => sum + ach.points, 0),
        updatedCount: countValue
      }
    }
  } catch (err) {
    return {
      success: false,
      errMsg: err.message
    }
  }
}