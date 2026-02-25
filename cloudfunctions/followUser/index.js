/**
 * 关注/取消关注云函数 - 社交模块 (v3)
 *
 * 上游依赖：users, follows, public_profiles
 * 入口：exports.main
 * 主要功能：关注/取消关注；维护 follower/following 计数（public_profiles）
 * 输出：isFollowing
 *
 * input: { uid: string, action: 'follow'|'unfollow' }
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
      ensureCollection('follows'),
      ensureCollection('users'),
      ensureCollection('public_profiles')
    ])

    const user = await getCurrentUser(openid)
    if (!user) return { success: false, errMsg: '用户不存在' }
    if (!user.uid) return { success: false, errMsg: '用户UID缺失' }

    const followeeUid = (event?.uid || '').trim()
    const action = event?.action || 'follow'

    if (!followeeUid) return { success: false, errMsg: 'uid不能为空' }
    if (followeeUid === user.uid) return { success: false, errMsg: '不能关注自己' }
    if (!['follow', 'unfollow'].includes(action)) return { success: false, errMsg: 'action不合法' }

    const followerUid = user.uid
    const docId = `${followerUid}_${followeeUid}`

    if (action === 'follow') {
      try {
        await db.collection('follows').doc(docId).set({
          data: { _id: docId, followerUid, followeeUid, createdAt: new Date() }
        })
      } catch (err) {
        // If already exists, ignore
      }

      // Best-effort counts
      try {
        await db.collection('public_profiles').doc(followerUid).update({
          data: { followingCount: _.inc(1), updatedAt: new Date() }
        })
      } catch (err) {}
      try {
        await db.collection('public_profiles').doc(followeeUid).update({
          data: { followerCount: _.inc(1), updatedAt: new Date() }
        })
      } catch (err) {}

      return { success: true, data: { isFollowing: true } }
    }

    // unfollow
    try {
      await db.collection('follows').doc(docId).remove()
    } catch (err) {
      // ignore
    }
    try {
      await db.collection('public_profiles').doc(followerUid).update({
        data: { followingCount: _.inc(-1), updatedAt: new Date() }
      })
    } catch (err) {}
    try {
      await db.collection('public_profiles').doc(followeeUid).update({
        data: { followerCount: _.inc(-1), updatedAt: new Date() }
      })
    } catch (err) {}

    return { success: true, data: { isFollowing: false } }
  } catch (err) {
    console.error('followUser failed:', err)
    return { success: false, errMsg: err.message }
  }
}

