/**
 * 提交诈骗反馈云函数 - 诈骗反馈模块 (v3)
 *
 * 上游依赖：users, scam_reports
 * 入口：exports.main
 * 主要功能：保存用户提交的诈骗行为反馈
 * 输出：reportId
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

function sanitizeText(s, maxLen) {
  if (typeof s !== 'string') return ''
  return s.trim().slice(0, maxLen)
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    await Promise.all([ensureCollection('scam_reports'), ensureCollection('users')])
    const user = await getCurrentUser(openid)
    if (!user || !user.uid) return { success: false, errMsg: '用户不存在' }

    const type = sanitizeText(event?.type, 30)
    const channel = sanitizeText(event?.channel, 30)
    const scamAccount = sanitizeText(event?.scamAccount, 80)
    const scamLink = sanitizeText(event?.scamLink, 200)
    const content = sanitizeText(event?.content, 1000)
    const images = Array.isArray(event?.images) ? event.images.slice(0, 9) : []

    if (!content) return { success: false, errMsg: '请填写反馈内容' }

    const now = new Date()
    const addRes = await db.collection('scam_reports').add({
      data: {
        reporterUid: user.uid,
        reporterNickName: user.nickName || '',
        reporterAvatarUrl: user.avatarUrl || '',
        type,
        channel,
        scamAccount,
        scamLink,
        content,
        images,
        createdAt: now
      }
    })

    return { success: true, data: { reportId: addRes._id } }
  } catch (err) {
    console.error('createScamReport failed:', err)
    return { success: false, errMsg: err.message }
  }
}

