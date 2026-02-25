/**
 * 更新主页展示云函数 - 个人主页模块 (v3)
 *
 * 上游依赖：users, public_profiles
 * 入口：exports.main
 * 主要功能：用户选择展示的成就（<=6）同步到 users 与 public_profiles
 * 输出：displayAchievementIds
 *
 * input: { displayAchievementIds: [] }
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

function sanitizeIds(arr) {
  if (!Array.isArray(arr)) return []
  const out = []
  for (const x of arr) {
    if (typeof x === 'string' && x.trim()) out.push(x.trim())
  }
  return Array.from(new Set(out)).slice(0, 6)
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    await Promise.all([ensureCollection('users'), ensureCollection('public_profiles')])
    const user = await getCurrentUser(openid)
    if (!user || !user.uid) return { success: false, errMsg: '用户不存在' }

    const displayAchievementIds = sanitizeIds(event?.displayAchievementIds)

    await db.collection('users').doc(user._id).update({
      data: { displayAchievementIds, updatedAt: new Date() }
    })

    // best-effort sync to public profile
    try {
      await db.collection('public_profiles').doc(user.uid).update({
        data: { displayAchievementIds, updatedAt: new Date() }
      })
    } catch (err) {}

    return { success: true, data: { displayAchievementIds } }
  } catch (err) {
    console.error('updateProfileDisplay failed:', err)
    return { success: false, errMsg: err.message }
  }
}

