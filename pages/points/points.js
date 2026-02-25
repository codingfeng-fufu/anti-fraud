/**
 * 积分商城页面 - 积分兑换模块
 * 
 * 上游依赖：本地存储数据（积分、兑换记录）
 * 入口：页面onLoad生命周期，通过loadUserPoints加载用户积分
 * 主要功能：商品展示、积分兑换、分类筛选、兑换记录管理
 * 输出：渲染积分商城界面，处理商品兑换逻辑
 * 
 * 重要：每当所属的代码发生变化时，必须对相应的文档进行更新操作！
 */
// pages/points/points.js
const { formatDateTimeLocal } = require('../../utils/util.js')

Page({
  data: {
    userPoints: 0,
    
    // 商品列表
    products: [],
    
    // 当前筛选分类
    currentCategory: 'all',
    
    // 兑换记录
    exchangeRecords: []
  },

  onLoad() {
    this.loadUserPointsFromCloud()
    this.loadProducts()
    this.loadExchangeRecords()
    this.loadUserBackpack()
  },

onShow() {
    this.loadUserPointsFromCloud()
  },

  // 从云端加载用户积分
  async loadUserPointsFromCloud() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'getUserInfo',
        data: {}
      })
      
      if (result.result.success) {
        const points = result.result.data.userInfo.points || 0
        this.setData({
          userPoints: points
        })
        wx.setStorageSync('points', points)
        console.log('从云端加载积分成功:', points)
      }
    } catch (err) {
      console.error('从云端加载积分失败：', err)
      // 降级到本地存储
      this.loadUserPoints()
    }
  },

  // 从云端加载商品
  async loadProducts() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'getProducts',
        data: {}
      })
      
      if (result.result.success) {
        this.setData({
          products: result.result.data.products
        })
        console.log('从云端加载商品成功:', result.result.data.products.length)
      }
    } catch (err) {
      console.error('从云端加载商品失败：', err)
    }
  },

  // 从云端加载兑换记录
  async loadExchangeRecords() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'getExchangeRecords',
        data: {}
      })
      
      if (result.result.success) {
        this.setData({
          exchangeRecords: result.result.data.records
        })
        console.log('从云端加载兑换记录成功:', result.result.data.records.length)
      }
    } catch (err) {
      console.error('从云端加载兑换记录失败：', err)
      // 降级到本地存储
      this.loadExchangeRecords()
    }
  },

  // 加载用户积分
  loadUserPoints() {
    try {
      const points = wx.getStorageSync('points') || 0
      this.setData({
        userPoints: points
      })
    } catch (e) {
      console.error('加载积分失败：', e)
    }
  },

  // 加载兑换记录
  async loadExchangeRecords() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'getExchangeRecords',
        data: {}
      })
      
      if (result.result.success) {
        this.setData({
          exchangeRecords: result.result.data.records
        })
        console.log('从云端加载兑换记录成功:', result.result.data.records.length)
      }
    } catch (err) {
      console.error('从云端加载兑换记录失败：', err)
      // 降级到本地存储
      try {
        const records = wx.getStorageSync('exchangeRecords') || []
        this.setData({
          exchangeRecords: records
        })
      } catch (e) {
        console.error('从本地加载兑换记录失败：', e)
      }
    }
  },

  // 加载用户积分
  loadUserPoints() {
    try {
      const points = wx.getStorageSync('points') || 0
      this.setData({
        userPoints: points
      })
    } catch (e) {
      console.error('加载积分失败：', e)
    }
  },

  // 筛选分类
  filterCategory(e) {
    const category = e.currentTarget.dataset.category
    this.setData({
      currentCategory: category
    })
  },

  // 查看兑换记录
  viewRecords() {
    wx.navigateTo({
      url: '/pages/points-history/points-history'
    })
  },

  navigateToBackpack() {
    wx.navigateTo({
      url: '/pages/backpack/backpack'
    })
  },

  getMorePoints() {
    wx.showModal({
      title: '获取积分',
      content: '完成每日签到、阅读文章、AI对话等任务可获得积分',
      showCancel: false
    })
  },

  // 兑换商品
  async exchangeProduct(e) {
    const productId = e.currentTarget.dataset.id
    const product = this.data.products.find(item => item.id === productId)

    if (!product) {
      wx.showToast({
        title: '商品不存在',
        icon: 'none'
      })
      return
    }

    // 检查积分是否足够
    if (this.data.userPoints < product.points) {
      wx.showModal({
        title: '积分不足',
        content: `兑换${product.name}需要${product.points}积分，当前积分${this.data.userPoints}`,
        showCancel: false
      })
      return
    }

    // 检查库存
    if (product.stock <= 0) {
      wx.showToast({
        title: '库存不足',
        icon: 'none'
      })
      return
    }

    // 确认兑换
    wx.showModal({
      title: '确认兑换',
      content: `确定用${product.points}积分兑换"${product.name}"吗？`,
      success: (res) => {
        if (res.confirm) {
          // v3：需要填写兑换信息（话费/流量等人工发放）
          if (product.requireRedeemInfo) {
            wx.navigateTo({
              url: `/pages/redeem-info/redeem-info?productId=${product.id}&name=${encodeURIComponent(product.name)}&points=${product.points}`
            })
            return
          }
          this.doExchangeProduct(product)
        }
      }
    })
  },

  // 执行商品兑换
  async doExchangeProduct(product) {
    wx.showLoading({
      title: '兑换中...'
    })

    try {
      const result = await wx.cloud.callFunction({
        name: 'redeemProduct',
        data: {
          productId: product.id
        }
      })

      if (result.result.success) {
        wx.hideLoading()
        
        // 更新本地积分（以服务端返回为准）
        const newPoints = typeof result.result.data?.newPoints === 'number'
          ? result.result.data.newPoints
          : (this.data.userPoints - product.points)
        wx.setStorageSync('points', newPoints)
        this.setData({ userPoints: newPoints })
        
        // 重新加载商品和积分
        this.loadProducts()
        this.loadUserPointsFromCloud()
        
        wx.showToast({
          title: '兑换成功！',
          icon: 'success'
        })
      } else {
        wx.hideLoading()
        wx.showToast({
          title: result.result.errMsg || '兑换失败',
          icon: 'none'
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('兑换商品失败：', err)
      wx.showToast({
        title: '兑换失败',
        icon: 'none'
      })
    }
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  }
})
