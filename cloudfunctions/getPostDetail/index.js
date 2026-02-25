/**
 * 获取社区帖子详情云函数 - 社区模块 (v3)
 *
 * 上游依赖：posts
 * 入口：exports.main
 * 主要功能：返回帖子详情（published）
 * 输出：post
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

exports.main = async (event) => {
  try {
    await ensureCollection('posts')
    const postId = event?.postId
    if (!postId) return { success: false, errMsg: 'postId不能为空' }

    const res = await db.collection('posts').doc(postId).get()
    const post = res.data
    if (!post || post.status !== 'published') {
      return { success: false, errMsg: '帖子不存在或已隐藏' }
    }
    return { success: true, data: { post } }
  } catch (err) {
    console.error('getPostDetail failed:', err)
    return { success: false, errMsg: err.message }
  }
}

