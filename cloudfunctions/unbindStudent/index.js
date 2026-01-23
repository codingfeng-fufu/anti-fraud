const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const userResult = await db.collection('users').where({
      _openid: openid
    }).get()

    if (userResult.data.length === 0) {
      return {
        success: false,
        errMsg: '用户不存在'
      }
    }

    const user = userResult.data[0]

    if (!user.isBound) {
      return {
        success: false,
        errMsg: '未绑定学号'
      }
    }

    await db.collection('users').doc(user._id).update({
      data: {
        isBound: false,
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
        updatedAt: new Date()
      }
    })

    return {
      success: true,
      message: '解绑成功'
    }
  } catch (err) {
    console.error('解绑学号失败：', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}