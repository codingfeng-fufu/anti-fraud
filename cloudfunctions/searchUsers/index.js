/**
 * 搜索用户云函数 - 搜索模块 (v3)
 *
 * 上游依赖：public_profiles
 * 入口：exports.main
 * 主要功能：按昵称或UID搜索用户公共资料
 * 输出：users（公共字段）
 *
 * 重要：每当所属的代码发生变化时，必须对相应的文档进行更新操作！
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

async function ensureCollection(name) {
  try {
    await db.collection(name).limit(1).get()
  } catch (err) {
    if (err.errCode === -502005) {
      try { await db.createCollection(name) } catch (e) {}
    }
  }
}

function sanitizeKeyword(s) {
  if (typeof s !== 'string') return ''
  return s.trim().slice(0, 30)
}

function sanitizeLimit(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return 20
  return Math.max(1, Math.min(50, Math.floor(v)))
}

exports.main = async (event) => {
  try {
    await ensureCollection('public_profiles')
    const keyword = sanitizeKeyword(event?.keyword)
    const limit = sanitizeLimit(event?.limit)
    if (!keyword) return { success: true, data: { users: [] } }

    const reg = db.RegExp({ regexp: keyword, options: 'i' })
    const where = _.or([{ nickName: reg }, { uid: reg }])

    const res = await db.collection('public_profiles')
      .where(where)
      .limit(limit)
      .get()

    const users = (res.data || []).map(p => ({
      uid: p.uid,
      nickName: p.nickName || '未设置昵称',
      avatarUrl: p.avatarUrl || '',
      quizPoints: p.quizPoints || 0
    }))

    return { success: true, data: { users } }
  } catch (err) {
    console.error('searchUsers failed:', err)
    return { success: false, errMsg: err.message }
  }
}

