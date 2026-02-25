/**
 * 标记通知已读云函数 - 消息模块 (v3)
 *
 * 上游依赖：users, notifications
 * 入口：exports.main
 * 主要功能：将指定通知标记为已读（仅允许本人）
 * 输出：success
 *
 * input: { notificationId }
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

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    await Promise.all([ensureCollection('notifications'), ensureCollection('users')])
    const user = await getCurrentUser(openid)
    if (!user || !user.uid) return { success: false, errMsg: '用户不存在' }

    const notificationId = event?.notificationId
    if (!notificationId) return { success: false, errMsg: 'notificationId不能为空' }

    const res = await db.collection('notifications').doc(notificationId).get()
    const doc = res.data
    if (!doc || doc.toUid !== user.uid) {
      return { success: false, errMsg: '无权限操作' }
    }

    await db.collection('notifications').doc(notificationId).update({
      data: { isRead: true }
    })

    return { success: true }
  } catch (err) {
    console.error('markNotificationRead failed:', err)
    return { success: false, errMsg: err.message }
  }
}

