/**
 * 社区页面 - 社区模块 (v3)
 *
 * 上游依赖：云函数(getPosts)，页面路由 community-post-create/community-post-detail
 * 入口：Tab页 onShow/onLoad
 * 主要功能：帖子流分页加载、跳转发帖与详情
 * 输出：帖子列表渲染
 *
 * 重要：每当所属的代码发生变化时，必须对相应的文档进行更新操作！
 */

const { formatDateTimeLocal } = require('../../utils/util')

Page({
  data: {
    posts: [],
    loading: false,
    hasMore: true,
    cursor: null
  },

  onLoad() {
    this.refresh()
  },

  onShow() {
    // 回到列表时可轻量刷新
  },

  async refresh() {
    this.setData({ posts: [], hasMore: true, cursor: null })
    await this.loadMore()
  },

  async loadMore() {
    if (this.data.loading || !this.data.hasMore) return
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'getPosts',
        data: { pageSize: 10, cursor: this.data.cursor }
      })
      if (res.result && res.result.success) {
        const { posts, nextCursor } = res.result.data
        const normalized = (posts || []).map(p => ({
          ...p,
          createdAtText: p.createdAt ? formatDateTimeLocal(new Date(p.createdAt)) : ''
        }))
        this.setData({
          posts: this.data.posts.concat(normalized),
          cursor: nextCursor,
          hasMore: !!nextCursor && normalized.length > 0,
          loading: false
        })
      } else {
        this.setData({ loading: false })
      }
    } catch (err) {
      console.error('loadMore posts failed:', err)
      this.setData({ loading: false })
    }
  },

  goCreate() {
    wx.navigateTo({ url: '/pages/community-post-create/community-post-create' })
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/community-post-detail/community-post-detail?id=${id}` })
  },

  goProfile(e) {
    const uid = e.currentTarget.dataset.uid
    if (!uid) return
    wx.navigateTo({ url: `/pages/profile/profile?uid=${uid}` })
  }
})
