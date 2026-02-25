/**
 * 创建社区帖子云函数 - 社区模块 (v3)
 *
 * 上游依赖：users, public_profiles, posts, follows, notifications
 * 入口：exports.main
 * 主要功能：发帖；给粉丝写入站内通知（new_post）
 * 输出：postId
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
      try {
        await db.createCollection(name)
      } catch (e) {
        console.error(`创建集合 ${name} 失败:`, e.message)
      }
    }
  }
}

async function getCurrentUser(openid) {
  const res = await db.collection('users').where({ _openid: openid }).get()
  return res.data && res.data[0]
}

function sanitizeText(s, maxLen) {
  if (typeof s !== 'string') return ''
  const v = s.trim()
  if (!v) return ''
  return v.slice(0, maxLen)
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    await Promise.all([
      ensureCollection('posts'),
      ensureCollection('users'),
      ensureCollection('public_profiles'),
      ensureCollection('follows'),
      ensureCollection('notifications')
    ])

    const user = await getCurrentUser(openid)
    if (!user) return { success: false, errMsg: '用户不存在' }
    if (!user.uid) return { success: false, errMsg: '用户UID缺失' }

    const content = sanitizeText(event?.content, 1000)
    const images = Array.isArray(event?.images) ? event.images.slice(0, 9) : []

    if (!content && images.length === 0) {
      return { success: false, errMsg: '内容不能为空' }
    }

    const now = new Date()

    const postRes = await db.collection('posts').add({
      data: {
        authorUid: user.uid,
        authorNickName: user.nickName || '',
        authorAvatarUrl: user.avatarUrl || '',
        content,
        images,
        status: 'published',
        commentCount: 0,
        likeCount: 0,
        createdAt: now,
        updatedAt: now
      }
    })

    const postId = postRes._id

    // Notify followers (best-effort; cap to avoid timeouts)
    try {
      const followersRes = await db.collection('follows')
        .where({ followeeUid: user.uid })
        .limit(200)
        .get()

      const followers = followersRes.data || []
      const previewText = content ? content.slice(0, 50) : '[图片]'

      for (const f of followers) {
        const toUid = f.followerUid
        if (!toUid || toUid === user.uid) continue
        await db.collection('notifications').add({
          data: {
            toUid,
            fromUid: user.uid,
            type: 'new_post',
            payload: {
              postId,
              previewText
            },
            isRead: false,
            createdAt: new Date()
          }
        })
      }
    } catch (err) {
      console.warn('notify followers failed:', err.message)
    }

    return { success: true, data: { postId } }
  } catch (err) {
    console.error('createPost failed:', err)
    return { success: false, errMsg: err.message }
  }
}

