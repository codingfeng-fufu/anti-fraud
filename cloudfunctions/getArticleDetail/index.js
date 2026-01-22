/**
 * 获取文章详情云函数 - 内容管理模块
 * 
 * 上游依赖：微信云开发环境，articles, users, read_records数据库集合
 * 入口：exports.main函数，处理文章详情请求
 * 主要功能：获取文章详情、增加浏览量、记录用户阅读历史、更新阅读统计
 * 输出：文章详情数据和相关文章列表
 * 
 * 重要：每当所属的代码发生变化时，必须对相应的文档进行更新操作！
 */

// 云函数：getArticleDetail
// 获取文章详情，并增加浏览量
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    const { articleId } = event
    
    if (!articleId) {
      return {
        success: false,
        errMsg: '文章ID不能为空'
      }
    }
    
    // 获取文章详情
    const result = await db.collection('articles')
      .doc(articleId)
      .get()
    
    if (!result.data) {
      return {
        success: false,
        errMsg: '文章不存在'
      }
    }
    
    const currentViews = result.data.views ?? result.data.viewCount ?? 0
    const viewUpdate = {}
    if (Object.prototype.hasOwnProperty.call(result.data, 'views')) {
      viewUpdate.views = _.inc(1)
    }
    if (Object.prototype.hasOwnProperty.call(result.data, 'viewCount')) {
      viewUpdate.viewCount = _.inc(1)
    }
    if (Object.keys(viewUpdate).length === 0) {
      viewUpdate.views = _.inc(1)
    }
    
    // 增加浏览量
    await db.collection('articles').doc(articleId).update({
      data: viewUpdate
    })
    
    // 记录用户阅读历史
    const openid = wxContext.OPENID
    let actionData = null
    if (openid) {
      try {
        // 查找用户ID
        const userResult = await db.collection('users').where({
          _openid: openid
        }).get()
        
        if (userResult.data.length > 0) {
          const userId = userResult.data[0]._id
          
          // 保存阅读记录
          await db.collection('read_records').add({
            data: {
              _openid: openid,
              userId,
              articleId,
              readAt: new Date()
            }
          })
          
           // 调用trackAction记录阅读行为，以检查阅读类成就并更新统计
           try {
             const trackActionResult = await cloud.callFunction({
               name: 'trackAction',
               data: {
                 action: 'read',
                 increment: 1
               }
             })
             
             if (trackActionResult.result && trackActionResult.result.success) {
               actionData = trackActionResult.result.data
             }
             
             console.log('Track read action result:', trackActionResult)
           } catch (trackErr) {
             console.log('Track read action failed:', trackErr.message)
             // 不影响获取文章详情成功，继续执行
             
             // 保持原有的阅读次数更新作为备用
             await db.collection('users').doc(userId).update({
               data: {
                 totalReadCount: _.inc(1)
               }
             })
           }
        }
      } catch (err) {
        console.error('记录阅读历史失败：', err)
      }
    }
    
    // 获取相关文章
    const relatedResult = await db.collection('articles')
      .where({
        category: result.data.category,
        _id: _.neq(articleId)
      })
      .limit(3)
      .get()
    
    return {
      success: true,
      data: {
        article: {
          ...result.data,
          views: currentViews + 1
        },
        relatedArticles: relatedResult.data,
        actionData
      }
    }
  } catch (err) {
    console.error('获取文章详情失败：', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}

