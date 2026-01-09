// 云函数：bindStudent
// 绑定学生信息（学号、学校、院系等）
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  try {
    const { 
      studentId,      // 学号（必填）
      realName,       // 真实姓名（可选）
      schoolId,       // 学校ID（必填）
      schoolName,     // 学校名称（必填）
      collegeId,      // 院系ID（可选）
      collegeName,    // 院系名称（可选）
      majorId,        // 专业ID（可选）
      majorName,      // 专业名称（可选）
      grade,          // 年级（可选）
      className,      // 班级（可选）
      phone           // 手机号（可选）
    } = event
    
    // 1. 验证必填字段
    if (!studentId || !schoolId) {
      return {
        success: false,
        errMsg: '学号和学校不能为空'
      }
    }
    
    // 2. 验证学号格式（中央财经大学：10位数字）
    if (!/^\d{10}$/.test(studentId)) {
      return {
        success: false,
        errMsg: '学号格式不正确，必须是10位数字，如：2023010001'
      }
    }
    
    // 3. 检查学号是否已被使用
    const existUser = await db.collection('users').where({
      studentId,
      _openid: _.neq(openid)  // 排除自己
    }).get()
    
    if (existUser.data.length > 0) {
      return {
        success: false,
        errMsg: '该学号已被绑定，请联系管理员'
      }
    }
    
    // 4. 更新用户信息
    const userResult = await db.collection('users').where({
      _openid: openid
    }).get()
    
    if (userResult.data.length === 0) {
      return {
        success: false,
        errMsg: '用户不存在'
      }
    }
    
    const userId = userResult.data[0]._id
    
    const updateData = {
      studentId,
      schoolId,
      schoolName: schoolName || '中央财经大学',
      isBound: true,
      verifiedAt: new Date(),
      updatedAt: new Date()
    }
    
    // 可选字段
    if (realName) updateData.realName = realName
    if (collegeId) updateData.collegeId = collegeId
    if (collegeName) updateData.collegeName = collegeName
    if (majorId) updateData.majorId = majorId
    if (majorName) updateData.majorName = majorName
    if (grade) updateData.grade = grade
    if (className) updateData.className = className
    if (phone) updateData.phone = phone
    
    await db.collection('users').doc(userId).update({
      data: updateData
    })
    
    // 5. 记录绑定日志
    try {
      await db.collection('bind_logs').add({
        data: {
          _openid: openid,
          userId,
          studentId,
          schoolId,
          bindAt: new Date()
        }
      })
    } catch (err) {
      console.error('记录绑定日志失败：', err)
    }
    
    // 6. 奖励积分（首次绑定）
    if (!userResult.data[0].isBound) {
      await db.collection('users').doc(userId).update({
        data: {
          points: _.inc(50)  // 绑定奖励 50 积分
        }
      })
    }
    
    // 7. 获取更新后的用户信息
    const updatedUser = await db.collection('users').doc(userId).get()
    
    return {
      success: true,
      data: {
        userInfo: updatedUser.data,
        isFirstBind: !userResult.data[0].isBound,
        rewardPoints: !userResult.data[0].isBound ? 50 : 0
      },
      message: '绑定成功！'
    }
  } catch (err) {
    console.error('绑定学号失败：', err)
    return {
      success: false,
      errMsg: err.message || '绑定失败，请重试'
    }
  }
}

