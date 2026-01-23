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
Page({
  data: {
    // 用户积分
    userPoints: 0,
    
    // 称号产品列表
    titleProducts: [],
    
    // 商品列表
    products: [
      {
        id: 'gift_1',
        name: '微信红包封面',
        desc: '限量反诈主题红包封面',
        icon: '🧧',
        points: 100,
        stock: 50,
        category: 'virtual',
        hot: true
      },
      {
        id: 'gift_2',
        name: '防诈骗知识手册',
        desc: 'PDF电子版，涵盖常见诈骗类型',
        icon: '📖',
        points: 50,
        stock: 999,
        category: 'virtual',
        hot: false
      },
      {
        id: 'gift_3',
        name: '反诈头像框',
        desc: '专属反诈卫士头像框',
        icon: '🖼️',
        points: 80,
        stock: 100,
        category: 'virtual',
        hot: true
      },
      {
        id: 'gift_4',
        name: '免签到卡',
        desc: '补签一次签到记录',
        icon: '🎫',
        points: 30,
        stock: 200,
        category: 'tool',
        hot: false
      },
      {
        id: 'gift_5',
        name: '双倍积分卡',
        desc: '签到积分翻倍（3天）',
        icon: '✨',
        points: 150,
        stock: 50,
        category: 'tool',
        hot: false
      },
      {
        id: 'gift_6',
        name: '经验加速卡',
        desc: '阅读经验翻倍（7天）',
        icon: '🚀',
        points: 200,
        stock: 30,
        category: 'tool',
        hot: true
      },
      {
        id: 'gift_7',
        name: '学校周边纪念品',
        desc: '学校主题文具套装',
        icon: '🎁',
        points: 500,
        stock: 10,
        category: 'physical',
        hot: true
      },
      {
        id: 'gift_8',
        name: '校园一卡通充值',
        desc: '10元充值券',
        icon: '💳',
        points: 1000,
        stock: 5,
        category: 'physical',
        hot: false
      }
    ],
    
    // 当前筛选分类
    currentCategory: 'all',
    
    // 兑换记录
    exchangeRecords: []
  },

  onLoad() {
    this.loadUserPoints()
    this.loadExchangeRecords()
    this.loadTitleProducts()
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
  loadExchangeRecords() {
    try {
      const records = wx.getStorageSync('exchangeRecords') || []
      this.setData({
        exchangeRecords: records
      })
    } catch (e) {
      console.error('加载兑换记录失败：', e)
    }
  },

  // 筛选分类
  filterCategory(e) {
    const category = e.currentTarget.dataset.category
    this.setData({
      currentCategory: category
    })
  },

  // 获取筛选后的商品
  getFilteredProducts() {
    const { products, currentCategory } = this.data
    if (currentCategory === 'all') {
      return products
    }
    return products.filter(item => item.category === currentCategory)
  },

  // 兑换商品
  exchangeProduct(e) {
    const id = e.currentTarget.dataset.id
    const product = this.data.products.find(item => item.id === id)
    
    if (!product) return
    
    // 检查库存
    if (product.stock <= 0) {
      wx.showToast({
        title: '商品已兑完',
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
    
    // 确认兑换
    wx.showModal({
      title: '确认兑换',
      content: `确定用${product.points}积分兑换${product.name}吗？`,
      success: (res) => {
        if (res.confirm) {
          this.doExchange(product)
        }
      }
    })
  },

  // 执行兑换
  doExchange(product) {
    try {
      // 扣除积分
      const newPoints = this.data.userPoints - product.points
      wx.setStorageSync('points', newPoints)
      
      // 减少库存
      const products = this.data.products.map(item => {
        if (item.id === product.id) {
          return {
            ...item,
            stock: item.stock - 1
          }
        }
        return item
      })
      
      // 添加兑换记录
      const record = {
        id: Date.now(),
        productId: product.id,
        productName: product.name,
        points: product.points,
        time: new Date().toISOString(),
        status: 'pending' // pending: 待发货, completed: 已完成
      }
      
      const records = [record, ...this.data.exchangeRecords]
      wx.setStorageSync('exchangeRecords', records)
      
      // 更新页面
      this.setData({
        userPoints: newPoints,
        products,
        exchangeRecords: records
      })
      
      // 提示成功
      wx.showToast({
        title: '兑换成功！',
        icon: 'success'
      })
      
      // 如果是虚拟商品，显示使用提示
      if (product.category === 'virtual' || product.category === 'tool') {
        setTimeout(() => {
          wx.showModal({
            title: '兑换成功',
            content: product.category === 'virtual' 
              ? '虚拟商品已发放到您的账户，请在"我的"页面查看'
              : '道具卡已发放到您的背包',
            showCancel: false
          })
        }, 1500)
      } else {
        // 实体商品需要填写地址
        setTimeout(() => {
          wx.showModal({
            title: '兑换成功',
            content: '请联系管理员填写收货地址',
            showCancel: false
          })
        }, 1500)
      }
      
    } catch (e) {
      console.error('兑换失败：', e)
      wx.showToast({
        title: '兑换失败',
        icon: 'none'
      })
    }
  },

  // 查看兑换记录
viewRecords() {
    wx.navigateTo({
      url: '/pages/points-history/points-history'
    })
  },

  // 获取更多积分
  getMorePoints() {
    wx.showModal({
      title: '获取积分',
      content: '完成每日签到、阅读文章、AI对话等任务可获得积分',
      showCancel: false
    })
  },

  // 加载称号产品
  async loadTitleProducts() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'getTitles',
        data: {}
      })

      if (result.result.success) {
        this.setData({
          titleProducts: result.result.data.titles || []
        })
      }
    } catch (err) {
      console.error('加载称号产品失败：', err)
    }
  },

  // 兑换称号
  async exchangeTitle(e) {
    const titleId = e.currentTarget.dataset.id
    const title = this.data.titleProducts.find(item => item.titleId === titleId)

    if (!title) return

    // 检查积分是否足够
    if (this.data.userPoints < title.points) {
      wx.showModal({
        title: '积分不足',
        content: `兑换${title.name}需要${title.points}积分，当前积分${this.data.userPoints}`,
        showCancel: false
      })
      return
    }

    // 检查是否已拥有此称号
    if (title.owned) {
      wx.showToast({
        title: '称号已拥有',
        icon: 'none'
      })
      return
    }

    // 确认兑换
    wx.showModal({
      title: '确认兑换',
      content: `确定用${title.points}积分兑换称号"${title.name}"吗？`,
      success: (res) => {
        if (res.confirm) {
          this.doExchangeTitle(title)
        }
      }
    })
  },

  // 执行称号兑换
  async doExchangeTitle(title) {
    wx.showLoading({
      title: '兑换中...'
    })

    try {
      const result = await wx.cloud.callFunction({
        name: 'redeemTitle',
        data: {
          titleId: title.titleId
        }
      })

      if (result.result.success) {
        wx.hideLoading()
        
        // 更新本地积分
        const newPoints = this.data.userPoints - title.points
        wx.setStorageSync('points', newPoints)
        
        // 重新加载称号产品和用户积分
        this.setData({
          userPoints: newPoints
        })
        
        this.loadTitleProducts()
        
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
      console.error('兑换称号失败：', err)
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
