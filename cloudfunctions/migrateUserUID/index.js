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
    console.log('开始迁移用户数据，添加UID字段...')

    const result = await db.collection('users').get()
    const users = result.data

    console.log(`找到 ${users.length} 个用户`)

    let updatedCount = 0
    let skippedCount = 0

    for (const user of users) {
      if (!user.uid) {
        const uid = generateUID()
        
        await db.collection('users').doc(user._id).update({
          data: {
            uid: uid,
            updatedAt: new Date()
          }
        })
        
        console.log(`用户 ${user._openid} 已分配UID: ${uid}`)
        updatedCount++
      } else {
        console.log(`用户 ${user._openid} 已有UID: ${user.uid}，跳过`)
        skippedCount++
      }
    }

    console.log(`迁移完成！更新了 ${updatedCount} 个用户，跳过了 ${skippedCount} 个用户`)

    return {
      success: true,
      data: {
        totalUsers: users.length,
        updatedCount,
        skippedCount
      },
      message: `迁移完成！更新了 ${updatedCount} 个用户，跳过了 ${skippedCount} 个用户`
    }
  } catch (err) {
    console.error('迁移失败：', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}