/**
 * 获取答题排行榜云函数 - 趣味答题模块 (v3)
 *
 * 上游依赖：public_profiles
 * 入口：exports.main
 * 主要功能：按 quizPoints 倒序返回排行榜
 * 输出：排行榜列表（仅公共字段）
 *
 * 重要：每当所属的代码发生变化时，必须对相应的文档进行更新操作！
 */

const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

async function ensureCollection(collectionName) {
  try {
    await db.collection(collectionName).limit(1).get()
  } catch (err) {
    if (err.errCode === -502005) {
      try {
        await db.createCollection(collectionName)
      } catch (createErr) {
        console.error(`创建集合 ${collectionName} 失败:`, createErr.message)
      }
    } else {
      console.error(`检查集合 ${collectionName} 失败:`, err.message)
    }
  }
}

function sanitizeLimit(limit) {
  const n = Number(limit)
  if (!Number.isFinite(n)) return 50
  return Math.max(1, Math.min(100, Math.floor(n)))
}

exports.main = async (event) => {
  try {
    await ensureCollection('public_profiles')
    const limit = sanitizeLimit(event?.limit ?? 50)

    const res = await db.collection('public_profiles')
      .orderBy('quizPoints', 'desc')
      .limit(limit)
      .get()

    const list = (res.data || []).map((p, idx) => ({
      rank: idx + 1,
      uid: p.uid,
      nickName: p.nickName || '未设置昵称',
      avatarUrl: p.avatarUrl || '',
      quizPoints: p.quizPoints || 0
    }))

    return { success: true, data: { list } }
  } catch (err) {
    console.error('getQuizLeaderboard failed:', err)
    return { success: false, errMsg: err.message }
  }
}

