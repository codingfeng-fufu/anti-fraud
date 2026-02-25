/**
 * 站内消息页面 - 消息模块 (v3)
 *
 * 上游依赖：云函数(getNotifications/markNotificationRead)
 * 入口：页面 onLoad
 * 主要功能：拉取通知列表，点击跳转并标记已读
 * 输出：消息列表渲染
 *
 * 重要：每当所属的代码发生变化时，必须对相应的文档进行更新操作！
 */

const { formatDateTimeLocal } = require('../../utils/util')

function buildDisplay(item) {
  const type = item.type
  if (type === 'new_post') {
    return {
      typeIcon: '📝',
      title: '关注用户发布了新帖子',
      desc: item.payload?.previewText || '点击查看'
    }
  }
  if (type === 'reply') {
    return {
      typeIcon: '💬',
      title: '有人回复了你',
      desc: item.payload?.previewText || '点击查看'
    }
  }
  return {
    typeIcon: '🔔',
    title: '通知',
    desc: item.payload?.previewText || ''
  }
}

Page({
  data: {
    list: [],
    loading: false,
    hasMore: true,
    cursor: null
  },

  onLoad() {
    this.refresh()
  },

  async refresh() {
    this.setData({ list: [], cursor: null, hasMore: true })
    await this.loadMore()
  },

  async loadMore() {
    if (this.data.loading || !this.data.hasMore) return
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'getNotifications',
        data: { pageSize: 20, cursor: this.data.cursor }
      })
      if (res.result && res.result.success) {
        const { list, nextCursor } = res.result.data
        const normalized = (list || []).map(n => {
          const display = buildDisplay(n)
          return {
            ...n,
            ...display,
            createdAtText: n.createdAt ? formatDateTimeLocal(new Date(n.createdAt)) : ''
          }
        })
        this.setData({
          list: this.data.list.concat(normalized),
          cursor: nextCursor,
          hasMore: !!nextCursor && normalized.length > 0,
          loading: false
        })
      } else {
        this.setData({ loading: false })
      }
    } catch (err) {
      console.error('getNotifications failed:', err)
      this.setData({ loading: false })
    }
  },

  async openNotification(e) {
    const id = e.currentTarget.dataset.id
    const n = this.data.list.find(x => x._id === id)
    if (!n) return

    // mark read (best-effort)
    if (!n.isRead) {
      try {
        await wx.cloud.callFunction({ name: 'markNotificationRead', data: { notificationId: id } })
        n.isRead = true
        this.setData({ list: this.data.list })
      } catch (err) {}
    }

    const type = n.type
    if (type === 'new_post') {
      const postId = n.payload?.postId
      if (postId) {
        wx.navigateTo({ url: `/pages/community-post-detail/community-post-detail?id=${postId}` })
      }
      return
    }
    if (type === 'reply') {
      const targetType = n.payload?.targetType
      const targetId = n.payload?.targetId
      if (targetType === 'post' && targetId) {
        wx.navigateTo({ url: `/pages/community-post-detail/community-post-detail?id=${targetId}` })
      } else if (targetType === 'article' && targetId) {
        wx.navigateTo({ url: `/pages/article-detail/article-detail?id=${targetId}` })
      }
      return
    }
  },

  goBack() {
    wx.navigateBack()
  }
})

