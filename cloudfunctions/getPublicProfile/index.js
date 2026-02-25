/**
 * 获取公共资料云函数 - 个人主页模块 (v3)
 *
 * 上游依赖：public_profiles, follows, titles, achievements, users
 * 入口：exports.main
 * 主要功能：根据 uid 返回公共资料；并返回展示的称号/成就详情；返回当前用户是否关注TA
 * 输出：profile, displayTitles, displayAchievements, isFollowing
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

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    await Promise.all([
      ensureCollection('public_profiles'),
      ensureCollection('follows'),
      ensureCollection('titles'),
      ensureCollection('achievements'),
      ensureCollection('users')
    ])

    const uid = (event?.uid || '').trim()
    if (!uid) return { success: false, errMsg: 'uid不能为空' }

    let profile = null
    try {
      const res = await db.collection('public_profiles').doc(uid).get()
      profile = res.data
    } catch (err) {}

    if (!profile) {
      // 兜底：若 public_profiles 缺失，尝试从 users 构建（不返回敏感字段）
      const userRes = await db.collection('users').where({ uid }).limit(1).get()
      const u = userRes.data && userRes.data[0]
      if (!u) return { success: false, errMsg: '用户不存在' }

      profile = {
        uid: u.uid,
        nickName: u.nickName || '',
        avatarUrl: u.avatarUrl || '',
        equippedTitleIds: Array.isArray(u.equippedTitles) ? u.equippedTitles : [],
        displayAchievementIds: Array.isArray(u.displayAchievementIds) ? u.displayAchievementIds : [],
        quizPoints: u.quizPoints || 0,
        quizTotalAttempts: u.quizTotalAttempts || 0,
        quizTotalCorrect: u.quizTotalCorrect || 0,
        quizMaxCorrect: u.quizMaxCorrect || 0,
        followerCount: 0,
        followingCount: 0
      }
    }

    const equippedTitleIds = Array.isArray(profile.equippedTitleIds) ? profile.equippedTitleIds : []
    const displayAchievementIds = Array.isArray(profile.displayAchievementIds) ? profile.displayAchievementIds : []

    let displayTitles = []
    if (equippedTitleIds.length > 0) {
      try {
        const titleRes = await db.collection('titles')
          .where({ titleId: _.in(equippedTitleIds) })
          .get()
        displayTitles = titleRes.data || []
      } catch (err) {}
    }

    let displayAchievements = []
    if (displayAchievementIds.length > 0) {
      try {
        const achRes = await db.collection('achievements')
          .where({ achievementId: _.in(displayAchievementIds) })
          .get()
        displayAchievements = achRes.data || []
      } catch (err) {}
    }

    // following state
    let isFollowing = false
    const me = await getCurrentUser(openid)
    if (me && me.uid && me.uid !== uid) {
      const followDocId = `${me.uid}_${uid}`
      try {
        const fRes = await db.collection('follows').doc(followDocId).get()
        isFollowing = !!fRes.data
      } catch (err) {
        isFollowing = false
      }
    }

    return {
      success: true,
      data: {
        profile,
        displayTitles,
        displayAchievements,
        isFollowing
      }
    }
  } catch (err) {
    console.error('getPublicProfile failed:', err)
    return { success: false, errMsg: err.message }
  }
}

