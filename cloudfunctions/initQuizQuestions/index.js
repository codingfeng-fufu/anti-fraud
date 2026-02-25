/**
 * 初始化趣味答题题库云函数 - 趣味答题模块 (v3)
 *
 * 上游依赖：微信云开发环境，quiz_questions 数据库集合
 * 入口：exports.main
 * 主要功能：初始化题库（50题），以 questionId 作为主键写入（可幂等执行）
 * 输出：初始化结果与写入数量
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

exports.main = async () => {
  try {
    await ensureCollection('quiz_questions')

    const seed = require('./questions.seed.json')
    const now = new Date()

    let inserted = 0
    let updated = 0

    for (const q of seed) {
      const docId = q._id || q.questionId
      if (!docId) continue

      const payload = {
        ...q,
        _id: docId,
        questionId: q.questionId || docId,
        isActive: true,
        updatedAt: now
      }

      // 幂等写入：若存在则更新；否则创建
      try {
        const existing = await db.collection('quiz_questions').doc(docId).get()
        if (existing && existing.data) {
          await db.collection('quiz_questions').doc(docId).update({ data: payload })
          updated += 1
        } else {
          await db.collection('quiz_questions').doc(docId).set({ data: { ...payload, createdAt: now } })
          inserted += 1
        }
      } catch (err) {
        // doc 不存在时 get 会抛错，直接 set
        await db.collection('quiz_questions').doc(docId).set({ data: { ...payload, createdAt: now } })
        inserted += 1
      }
    }

    return {
      success: true,
      message: `题库初始化完成，新增 ${inserted} 题，更新 ${updated} 题`,
      data: { inserted, updated, total: inserted + updated }
    }
  } catch (err) {
    console.error('initQuizQuestions failed:', err)
    return { success: false, errMsg: err.message }
  }
}

