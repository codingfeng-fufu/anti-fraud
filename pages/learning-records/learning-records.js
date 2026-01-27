/**
 * 学习记录页面 - 学习记录模块
 * 
 * 上游依赖：云函数(getLearningRecords)，本地缓存
 * 入口：页面onLoad/onShow生命周期
 * 主要功能：展示用户阅读历史、学习统计、阅读进度
 * 输出：渲染学习记录界面
 * 
 * 重要：每当所属的代码发生变化时，必须对相应的文档进行更新操作！
 */

Page({
  data: {
    records: [],
    stats: {
      totalReadCount: 0,
      firstReadCount: 0,
      recentReadCount: 0,
      consecutiveDays: 0,
      categoryStats: {}
    },
    pagination: {
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 0
    },
    currentCategory: 'all',
    categories: ['all', '电信诈骗', '网络诈骗', '投资理财', '校园贷', '刷单兼职'],
    loading: false,
    hasMore: true
  },

  onLoad(options) {
    console.log('learning-records onLoad')
    this.loadLearningRecords()
  },

  onShow() {
    this.loadLearningRecords()
  },

  async loadLearningRecords() {
    if (this.data.loading) return
    
    const { page, pageSize, currentCategory } = this.data
    
    if (page > 1 && !this.data.hasMore) return
    
    this.setData({ loading: true })
    
    try {
      const result = await wx.cloud.callFunction({
        name: 'getLearningRecords',
        data: {
          page,
          pageSize,
          category: currentCategory === 'all' ? undefined : currentCategory
        }
      })

      if (result.result.success) {
        const { records, pagination, stats } = result.result.data
        
        this.setData({
          records: page === 1 ? records : [...this.data.records, ...records],
          pagination,
          stats: page === 1 ? stats : this.data.stats,
          hasMore: page < pagination.totalPages
        })
      } else {
        wx.showToast({
          title: result.result.errMsg || '加载失败',
          icon: 'none'
        })
      }
    } catch (err) {
      console.error('加载学习记录失败：', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({
        pagination: {
          ...this.data.pagination,
          page: this.data.pagination.page + 1
        }
      })
      this.loadLearningRecords()
    }
  },

  onPullDownRefresh() {
    this.setData({
      records: [],
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0
      },
      hasMore: true
    })
    this.loadLearningRecords()
    wx.stopPullDownRefresh()
  },

  switchCategory(e) {
    const category = e.currentTarget.dataset.category
    this.setData({
      currentCategory: category,
      records: [],
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0
      },
      hasMore: true
    })
    this.loadLearningRecords()
  },

  formatDate(dateStr) {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now - date
    
    const minute = 60 * 1000
    const hour = 60 * minute
    const day = 24 * hour
    
    if (diff < minute) {
      return '刚刚'
    } else if (diff < hour) {
      return `${Math.floor(diff / minute)}分钟前`
    } else if (diff < day) {
      return `${Math.floor(diff / hour)}小时前`
    } else if (diff < day * 7) {
      return `${Math.floor(diff / day)}天前`
    } else {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    }
  },

  goBack() {
    wx.navigateBack()
  }
})