/**
 * 获取趣味答题题目云函数 - 趣味答题模块 (v3)
 *
 * 上游依赖：quiz_questions
 * 入口：exports.main
 * 主要功能：随机抽取指定数量题目（默认10），不下发正确答案与解析
 * 输出：题目列表（questionId, question, options, difficulty, tags）
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

function sanitizeCount(count) {
  const n = Number(count)
  if (!Number.isFinite(n)) return 10
  return Math.max(1, Math.min(20, Math.floor(n)))
}

exports.main = async (event) => {
  try {
    await ensureCollection('quiz_questions')

    const count = sanitizeCount(event?.count ?? 10)

    // 优先使用聚合随机采样
    let questions = []
    try {
      const res = await db.collection('quiz_questions')
        .aggregate()
        .match({ isActive: true })
        .sample({ size: count })
        .project({
          _id: 0,
          questionId: 1,
          question: 1,
          options: 1,
          difficulty: 1,
          tags: 1
        })
        .end()
      questions = (res.list || []).map(item => ({
        questionId: item.questionId,
        question: item.question,
        options: item.options,
        difficulty: item.difficulty || 1,
        tags: item.tags || []
      }))
    } catch (err) {
      console.warn('aggregate.sample failed, fallback to non-random:', err.message)
    }

    // 降级：直接取前count道（不随机）
    if (!questions || questions.length === 0) {
      const res = await db.collection('quiz_questions')
        .where({ isActive: true })
        .limit(count)
        .get()
      questions = (res.data || []).map(item => ({
        questionId: item.questionId,
        question: item.question,
        options: item.options,
        difficulty: item.difficulty || 1,
        tags: item.tags || []
      }))
    }

    if (!questions || questions.length === 0) {
      try {
        await cloud.callFunction({ name: 'initQuizQuestions', data: {} })
        const res = await db.collection('quiz_questions')
          .where({ isActive: true })
          .limit(count)
          .get()
        questions = (res.data || []).map(item => ({
          questionId: item.questionId,
          question: item.question,
          options: item.options,
          difficulty: item.difficulty || 1,
          tags: item.tags || []
        }))
      } catch (err) {
        console.warn('initQuizQuestions failed:', err?.message || err)
      }
    }

    if (!questions || questions.length === 0) {
      const res = await db.collection('quiz_questions')
        .limit(count)
        .get()
      questions = (res.data || []).map(item => ({
        questionId: item.questionId,
        question: item.question,
        options: item.options,
        difficulty: item.difficulty || 1,
        tags: item.tags || []
      }))
    }

    return {
      success: true,
      data: { questions, count: questions.length }
    }
  } catch (err) {
    console.error('getQuizQuestions failed:', err)
    return { success: false, errMsg: err.message }
  }
}

