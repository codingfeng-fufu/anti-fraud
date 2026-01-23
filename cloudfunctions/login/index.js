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

function generateUID() {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return timestamp + random
}

function sanitizeInput(input) {
  if (typeof input !== 'string') return ''
  return input.replace(/[<>\"'%;()&+]/g, '').trim().slice(0, 20)
}

async function checkNicknameExists(nickname, excludeOpenid = null) {
  try {
    const whereCondition = {
      nickName: nickname
    }
    
    if (excludeOpenid) {
      whereCondition._openid = db.command.neq(excludeOpenid)
    }
    
    const result = await db.collection('users').where(whereCondition).count()
    return result.total > 0
  } catch (err) {
    console.error('检查昵称重复失败：', err)
    return false
  }
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    const openid = wxContext.OPENID
    const nickName = event.nickName ? sanitizeInput(event.nickName) : null
    const avatarUrl = event.avatarUrl || ''
    
    const userResult = await db.collection('users').where({
      _openid: openid
    }).get()
    
    let userData = null
    
    if (userResult.data.length === 0) {
      const uid = generateUID()
      const defaultNickname = nickName || `反诈先锋${uid}`
      
      if (nickName) {
        const exists = await checkNicknameExists(nickName)
        if (exists) {
          return {
            success: false,
            errMsg: '该昵称已被使用，请更换其他昵称'
          }
        }
      }
      
      const now = new Date()
      const newUser = {
        _openid: openid,
        uid: uid,
        nickName: defaultNickname,
        avatarUrl: avatarUrl,
        
        studentId: '',
        realName: '',
        schoolId: '',
        schoolName: '',
        collegeId: '',
        collegeName: '',
        majorId: '',
        majorName: '',
        grade: '',
        className: '',
        phone: '',
        
        isVerified: false,
        verifiedAt: null,
        isBound: false,
        
        signDates: [],
        points: 0,
        achievements: [],
        titles: [],
        equippedTitles: [],
        continuousLearnDays: 0,
        lastLearnDate: null,
        totalReadCount: 0,
        totalChatCount: 0,
        lastChatDate: null,
        lastReadDate: null,
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
      userData = userResult.data[0]
      
      if (nickName || avatarUrl) {
        if (nickName && nickName !== userData.nickName) {
          const exists = await checkNicknameExists(nickName, openid)
          if (exists) {
            return {
              success: false,
              errMsg: '该昵称已被使用，请更换其他昵称'
            }
          }
        }
        
        await db.collection('users').doc(userData._id).update({
          data: {
            nickName: nickName || userData.nickName,
            avatarUrl: avatarUrl || userData.avatarUrl,
            updatedAt: new Date()
          }
        })
        
        userData.nickName = nickName || userData.nickName
        userData.avatarUrl = avatarUrl || userData.avatarUrl
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

