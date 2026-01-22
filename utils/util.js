/**
 * 工具函数模块 - 通用辅助功能
 * 
 * 上游依赖：无
 * 入口：导出的formatTime函数
 * 主要功能：时间格式化
 * 输出：格式化的时间字符串
 * 
 * 重要：每当所属的代码发生变化时，必须对相应的文档进行更新操作！
 */

const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

module.exports = {
  formatTime
}
