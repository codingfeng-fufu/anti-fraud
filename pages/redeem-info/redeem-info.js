/**
 * 兑换信息填写页面 - 积分商城模块 (v3)
 *
 * 上游依赖：云函数(redeemProduct)
 * 入口：从积分商城跳转携带 productId/name/points
 * 主要功能：填写手机号/运营商并兑换（仅记录 + 扣积分 + 人工发放）
 * 输出：兑换结果；成功后返回积分商城刷新
 *
 * 重要：每当所属的代码发生变化时，必须对相应的文档进行更新操作！
 */

Page({
  data: {
    productId: '',
    productName: '',
    productPoints: 0,
    phone: '',
    carrierOptions: ['移动', '联通', '电信', '其他'],
    carrierIndex: 0,
    note: '',
    submitting: false
  },

  onLoad(options) {
    this.setData({
      productId: options.productId || '',
      productName: options.name ? decodeURIComponent(options.name) : '',
      productPoints: Number(options.points) || 0
    })
  },

  onPhone(e) { this.setData({ phone: e.detail.value }) },
  onCarrier(e) { this.setData({ carrierIndex: Number(e.detail.value) || 0 }) },
  onNote(e) { this.setData({ note: e.detail.value }) },

  async submit() {
    if (this.data.submitting) return
    const phone = (this.data.phone || '').trim()
    if (!/^1\\d{10}$/.test(phone)) {
      wx.showToast({ title: '请输入正确手机号', icon: 'none' })
      return
    }
    this.setData({ submitting: true })
    wx.showLoading({ title: '兑换中...' })
    try {
      const res = await wx.cloud.callFunction({
        name: 'redeemProduct',
        data: {
          productId: this.data.productId,
          redeemInfo: {
            phone,
            carrier: this.data.carrierOptions[this.data.carrierIndex],
            note: (this.data.note || '').trim()
          }
        }
      })
      wx.hideLoading()
      if (res.result && res.result.success) {
        // 同步本地积分
        if (typeof res.result.data?.newPoints === 'number') {
          wx.setStorageSync('points', res.result.data.newPoints)
        }
        wx.showToast({ title: '兑换成功', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 600)
      } else {
        wx.showToast({ title: res.result?.errMsg || '兑换失败', icon: 'none' })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('redeemProduct failed:', err)
      wx.showToast({ title: '兑换失败', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  },

  goBack() { wx.navigateBack() }
})

