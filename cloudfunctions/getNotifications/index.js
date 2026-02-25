/**
 * 获取站内通知列表云函数 - 消息模块 (v3)
 *
 * 上游依赖：users, notifications
 * 入口：exports.main
 * 主要功能：分页获取当前用户通知（按 createdAt 倒序）
 * 输出：list, nextCursor
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

async function getCurrentUser(openid) {
  const res = await db.collection('users').where({ _openid: openid }).get()
  return res.data && res.data[0]
}

function sanitizePageSize(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return 20
  return Math.max(10, Math.min(50, Math.floor(v)))
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    await Promise.all([ensureCollection('notifications'), ensureCollection('users')])
    const user = await getCurrentUser(openid)
    if (!user || !user.uid) return { success: false, errMsg: '用户不存在' }

    const pageSize = sanitizePageSize(event?.pageSize)
    const cursor = event?.cursor

    const where = { toUid: user.uid }
    if (cursor) {
      where.createdAt = _.lt(new Date(Number(cursor)))
    }

    const res = await db.collection('notifications')
      .where(where)
      .orderBy('createdAt', 'desc')
      .limit(pageSize)
      .get()

    const list = res.data || []
    const last = list[list.length - 1]
    const nextCursor = last?.createdAt ? new Date(last.createdAt).getTime() : null

    return { success: true, data: { list, nextCursor } }
  } catch (err) {
    console.error('getNotifications failed:', err)
    return { success: false, errMsg: err.message }
  }
}

