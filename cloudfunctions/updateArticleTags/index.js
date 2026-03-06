/**
 * 批量更新文章标签云函数
 * 用于给现有文章添加 tag 和 tagType 字段
 */

const cloud = require('wx-server-sdk')

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
    try {
        console.log('开始批量更新文章标签...')

        // 获取所有文章
        const { data: articles } = await db.collection('articles').get()

        console.log(`找到 ${articles.length} 篇文章`)

        if (articles.length === 0) {
            return {
                success: true,
                message: '没有需要更新的文章'
            }
        }

        // 批量更新
        const updateTasks = articles.map(article => {
            // 根据标题关键词判断类型
            let tag = '知识科普'
            let tagType = 'info'

            const title = article.title || ''

            // 紧急预警类
            if (title.includes('警惕') ||
                title.includes('预警') ||
                title.includes('紧急') ||
                title.includes('升级') ||
                title.includes('新型')) {
                tag = '紧急预警'
                tagType = 'danger'
            }
            // 案例分析类
            else if (title.includes('案例') ||
                title.includes('揭秘') ||
                title.includes('遇') ||
                title.includes('掉入')) {
                tag = '案例分析'
                tagType = 'warning'
            }
            // 防骗知识类
            else if (title.includes('防骗') ||
                title.includes('陷阱') ||
                title.includes('套路') ||
                title.includes('必知')) {
                tag = '防骗知识'
                tagType = 'warning'
            }
            // 知识科普类
            else if (title.includes('科普') ||
                title.includes('了解') ||
                title.includes('识别') ||
                title.includes('如何')) {
                tag = '知识科普'
                tagType = 'info'
            }
            // 视频教程类
            else if (title.includes('视频') ||
                title.includes('教程') ||
                title.includes('分钟')) {
                tag = '视频教程'
                tagType = 'info'
            }
            // 指南类
            else if (title.includes('指南') ||
                title.includes('攻略')) {
                tag = '防骗指南'
                tagType = 'info'
            }

            console.log(`更新文章: ${article.title} -> ${tag} (${tagType})`)

            return db.collection('articles').doc(article._id).update({
                data: {
                    tag: tag,
                    tagType: tagType
                }
            })
        })

        // 执行所有更新任务
        const results = await Promise.all(updateTasks)

        console.log('批量更新完成')

        return {
            success: true,
            message: `成功更新 ${results.length} 篇文章的标签`,
            count: results.length
        }

    } catch (err) {
        console.error('批量更新失败：', err)
        return {
            success: false,
            error: err.message,
            stack: err.stack
        }
    }
}
