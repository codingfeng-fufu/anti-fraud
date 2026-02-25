/**
 * 获取未读通知数量云函数 - 消息模块 (v3)
 *
 * 上游依赖：users, notifications
 * 入口：exports.main
 * 主要功能：统计当前用户未读通知数量
 * 输出：unread
 *
 * 重要：每当所属的代码发生变化时，必须对相应的文档进行更新操作！
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

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

exports.main = async () => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    await Promise.all([ensureCollection('notifications'), ensureCollection('users')])
    const user = await getCurrentUser(openid)
    if (!user || !user.uid) return { success: false, errMsg: '用户不存在' }

    const countRes = await db.collection('notifications')
      .where({ toUid: user.uid, isRead: false })
      .count()

    return { success: true, data: { unread: countRes.total || 0 } }
  } catch (err) {
    console.error('getUnreadCount failed:', err)
    return { success: false, errMsg: err.message }
  }
}

