const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

function generateUID() {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return timestamp + random
}

exports.main = async (event, context) => {
  try {
    console.log('开始检查和修复用户数据...')

    const result = await db.collection('users').get()
    const users = result.data

    console.log(`找到 ${users.length} 个用户`)

    let updatedCount = 0
    let skippedCount = 0
    const updateDetails = []

    for (const user of users) {
      const updateData = {}
      let needsUpdate = false

      if (!user.uid) {
        updateData.uid = generateUID()
        needsUpdate = true
        console.log(`用户 ${user._openid} 缺少UID`)
      }

      if (user.studentId === undefined) {
        updateData.studentId = ''
        needsUpdate = true
      }

      if (user.realName === undefined) {
        updateData.realName = ''
        needsUpdate = true
      }

      if (user.schoolId === undefined) {
        updateData.schoolId = ''
        needsUpdate = true
      }

      if (user.schoolName === undefined) {
        updateData.schoolName = ''
        needsUpdate = true
      }

      if (user.collegeId === undefined) {
        updateData.collegeId = ''
        needsUpdate = true
      }

      if (user.collegeName === undefined) {
        updateData.collegeName = ''
        needsUpdate = true
      }

      if (user.majorId === undefined) {
        updateData.majorId = ''
        needsUpdate = true
      }

      if (user.majorName === undefined) {
        updateData.majorName = ''
        needsUpdate = true
      }

      if (user.grade === undefined) {
        updateData.grade = ''
        needsUpdate = true
      }

      if (user.className === undefined) {
        updateData.className = ''
        needsUpdate = true
      }

      if (user.phone === undefined) {
        updateData.phone = ''
        needsUpdate = true
      }

      if (user.isVerified === undefined) {
        updateData.isVerified = false
        needsUpdate = true
      }

      if (user.verifiedAt === undefined) {
        updateData.verifiedAt = null
        needsUpdate = true
      }

      if (user.isBound === undefined) {
        updateData.isBound = false
        needsUpdate = true
      }

      if (user.signDates === undefined) {
        updateData.signDates = []
        needsUpdate = true
      }

      if (user.points === undefined) {
        updateData.points = 0
        needsUpdate = true
      }

      if (user.achievements === undefined) {
        updateData.achievements = []
        needsUpdate = true
      }

      if (user.titles === undefined) {
        updateData.titles = []
        needsUpdate = true
      }

      if (user.equippedTitles === undefined) {
        updateData.equippedTitles = []
        needsUpdate = true
      }

      if (user.continuousLearnDays === undefined) {
        updateData.continuousLearnDays = 0
        needsUpdate = true
      }

      if (user.lastLearnDate === undefined) {
        updateData.lastLearnDate = null
        needsUpdate = true
      }

      if (user.totalReadCount === undefined) {
        updateData.totalReadCount = 0
        needsUpdate = true
      }

      if (user.totalChatCount === undefined) {
        updateData.totalChatCount = 0
        needsUpdate = true
      }

      if (user.lastChatDate === undefined) {
        updateData.lastChatDate = null
        needsUpdate = true
      }

      if (user.lastReadDate === undefined) {
        updateData.lastReadDate = null
        needsUpdate = true
      }

      if (needsUpdate) {
        updateData.updatedAt = new Date()
        
        await db.collection('users').doc(user._id).update({
          data: updateData
        })
        
        const detail = {
          openid: user._openid,
          uid: updateData.uid || user.uid,
          updatedFields: Object.keys(updateData)
        }
        updateDetails.push(detail)
        
        console.log(`用户 ${user._openid} 已更新字段:`, Object.keys(updateData).join(', '))
        updatedCount++
      } else {
        skippedCount++
      }
    }

    console.log(`检查完成！更新了 ${updatedCount} 个用户，跳过了 ${skippedCount} 个用户`)

    return {
      success: true,
      data: {
        totalUsers: users.length,
        updatedCount,
        skippedCount,
        updateDetails
      },
      message: `检查完成！更新了 ${updatedCount} 个用户，跳过了 ${skippedCount} 个用户`
    }
  } catch (err) {
    console.error('检查和修复失败：', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}