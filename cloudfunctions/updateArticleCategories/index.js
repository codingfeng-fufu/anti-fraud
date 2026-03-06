/**
 * 批量更新文章分类云函数
 * 用于给现有文章添加或修正 category 字段
 */

const cloud = require('wx-server-sdk')

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
    try {
        console.log('开始批量更新文章分类...')

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
            // 根据标题关键词判断分类
            let category = '全部'

            const title = article.title || ''

            // 刷单返利类
            if (title.includes('刷单') ||
                title.includes('兼职') ||
                title.includes('返利')) {
                category = '刷单返利'
            }
            // 虚假投资理财类
            else if (title.includes('投资') ||
                title.includes('理财') ||
                title.includes('高收益')) {
                category = '虚假投资理财'
            }
            // 虚假购物服务类
            else if (title.includes('购物') ||
                title.includes('商品')) {
                category = '虚假购物服务'
            }
            // 冒充电商客服类
            else if (title.includes('退款') ||
                title.includes('客服') ||
                title.includes('网购')) {
                category = '冒充电商客服'
            }
            // 虚假贷款类
            else if (title.includes('贷款') ||
                title.includes('校园贷') ||
                title.includes('培训贷')) {
                category = '虚假贷款'
            }
            // 虚假征信类
            else if (title.includes('征信') ||
                title.includes('信用')) {
                category = '虚假征信'
            }
            // 冒充领导熟人类
            else if (title.includes('领导') ||
                title.includes('熟人')) {
                category = '冒充领导熟人'
            }
            // 冒充公检法类
            else if (title.includes('公检法') ||
                title.includes('警察') ||
                title.includes('法院') ||
                title.includes('检察院')) {
                category = '冒充公检法'
            }
            // 网络婚恋交友类
            else if (title.includes('婚恋') ||
                title.includes('交友') ||
                title.includes('恋爱') ||
                title.includes('杀猪盘')) {
                category = '网络婚恋交友'
            }
            // 网游虚假交易类
            else if (title.includes('游戏') ||
                title.includes('网游') ||
                title.includes('装备')) {
                category = '网游虚假交易'
            }

            console.log(`更新文章: ${article.title} -> ${category}`)

            return db.collection('articles').doc(article._id).update({
                data: {
                    category: category
                }
            })
        })

        // 执行所有更新任务
        const results = await Promise.all(updateTasks)

        console.log('批量更新完成')

        return {
            success: true,
            message: `成功更新 ${results.length} 篇文章的分类`,
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
