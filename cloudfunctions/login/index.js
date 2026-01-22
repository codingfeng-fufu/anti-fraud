/**
 * 用户登录云函数 - 用户认证模块
 * 
 * 上游依赖：微信云开发环境，users数据库集合
 * 入口：exports.main函数，处理用户登录请求
 * 主要功能：用户身份验证、用户信息管理、新用户创建
 * 输出：用户信息和openid，创建或更新用户数据
 * 
 * 重要：每当所属的代码发生变化时，必须对相应的文档进行更新操作！
 */

// 云函数：login
// 用于获取用户的 openid 和管理用户信息
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    // 获取用户的 openid
    const openid = wxContext.OPENID
    
    // 查询用户是否已存在
    const userResult = await db.collection('users').where({
      _openid: openid
    }).get()
    
    let userData = null
    
    if (userResult.data.length === 0) {
      // 新用户，创建用户记录
      const now = new Date()
      const newUser = {
        _openid: openid,
        nickName: event.nickName || '反诈用户',
        avatarUrl: event.avatarUrl || '',
        signDays: 0,
        points: 0,
        achievements: [],
        totalReadCount: 0,
        totalChatCount: 0,
        lastSignDate: null,
        createdAt: now,
        updatedAt: now
      }
      
      const addResult = await db.collection('users').add({
        data: newUser
      })
      
      userData = {
        ...newUser,
        _id: addResult._id
      }
    } else {
      // 老用户，更新信息
      userData = userResult.data[0]
      
      // 如果传入了新的昵称和头像，更新用户信息
      if (event.nickName || event.avatarUrl) {
        await db.collection('users').doc(userData._id).update({
          data: {
            nickName: event.nickName || userData.nickName,
            avatarUrl: event.avatarUrl || userData.avatarUrl,
            updatedAt: new Date()
          }
        })
      }
    }
    
    return {
      success: true,
      data: {
        openid,
        userInfo: userData
      }
    }
  } catch (err) {
    console.error('登录失败：', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}

