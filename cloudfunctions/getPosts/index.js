/**
 * 获取社区帖子列表云函数 - 社区模块 (v3)
 *
 * 上游依赖：posts
 * 入口：exports.main
 * 主要功能：分页拉取帖子流（按 createdAt 倒序）
 * 输出：posts, nextCursor
 *
 * cursor 约定：毫秒时间戳（number），表示“上一页最后一条 createdAt 的时间”
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

function sanitizePageSize(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return 10
  return Math.max(5, Math.min(20, Math.floor(v)))
}

exports.main = async (event) => {
  try {
    await ensureCollection('posts')
    const pageSize = sanitizePageSize(event?.pageSize)
    const cursor = event?.cursor

    const where = { status: 'published' }
    if (cursor) {
      const t = new Date(Number(cursor))
      where.createdAt = _.lt(t)
    }

    const res = await db.collection('posts')
      .where(where)
      .orderBy('createdAt', 'desc')
      .limit(pageSize)
      .get()

    const posts = res.data || []
    const last = posts[posts.length - 1]
    const nextCursor = last?.createdAt ? new Date(last.createdAt).getTime() : null

    return { success: true, data: { posts, nextCursor } }
  } catch (err) {
    console.error('getPosts failed:', err)
    return { success: false, errMsg: err.message }
  }
}

