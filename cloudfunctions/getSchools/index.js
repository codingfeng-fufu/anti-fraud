/**
 * 获取学校信息云函数 - 学校数据模块
 * 
 * 上游依赖：微信云开发环境，schools, colleges, majors数据库集合
 * 入口：exports.main函数，处理学校信息查询请求
 * 主要功能：获取学校列表、院系列表、专业列表
 * 输出：学校、院系或专业数据列表
 * 
 * 重要：每当所属的代码发生变化时，必须对相应的文档进行更新操作！
 */

// 云函数：getSchools
// 获取学校、院系、专业列表
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const { type, schoolId, collegeId } = event
    
    switch (type) {
      case 'schools':
        // 获取学校列表
        const schools = await db.collection('schools')
          .where({ isActive: true })
          .field({
            schoolId: true,
            schoolName: true,
            province: true,
            city: true,
            logo: true,
            studentIdPattern: true,
            studentIdExample: true
          })
          .get()
        
        return {
          success: true,
          data: schools.data
        }
      
      case 'colleges':
        // 获取院系列表
        if (!schoolId) {
          return { success: false, errMsg: '学校ID不能为空' }
        }
        
        const colleges = await db.collection('colleges')
          .where({ 
            schoolId,
            isActive: true 
          })
          .field({
            collegeId: true,
            collegeName: true,
            shortName: true
          })
          .get()
        
        return {
          success: true,
          data: colleges.data
        }
      
      case 'majors':
        // 获取专业列表
        if (!schoolId) {
          return { success: false, errMsg: '学校ID不能为空' }
        }
        
        const query = { schoolId, isActive: true }
        if (collegeId) {
          query.collegeId = collegeId
        }
        
        const majors = await db.collection('majors')
          .where(query)
          .field({
            majorId: true,
            majorName: true,
            collegeId: true,
            degree: true
          })
          .get()
        
        return {
          success: true,
          data: majors.data
        }
      
      default:
        return {
          success: false,
          errMsg: '无效的查询类型'
        }
    }
  } catch (err) {
    console.error('查询失败：', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}

