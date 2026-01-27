// 初始化称号数据的云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 初始称号数据
const titlesData = [
  {
    titleId: "anti_fraud_pioneer",
    name: "反诈先锋",
    desc: "致力于反诈骗事业",
    icon: "🔥",
    type: "redeem",
    rarity: "rare",
    points: 100,
    isActive: true,
    createdAt: new Date()
  },
  {
    titleId: "guardian_of_truth",
    name: "真理守护者",
    desc: "守护真相，远离诈骗",
    icon: "🛡️",
    type: "redeem",
    rarity: "rare",
    points: 200,
    isActive: true,
    createdAt: new Date()
  },
  {
    titleId: "wisdom_seeker",
    name: "智慧追寻者",
    desc: "追寻智慧，防范风险",
    icon: "🎓",
    type: "redeem",
    rarity: "epic",
    points: 300,
    isActive: true,
    createdAt: new Date()
  },
  {
    titleId: "hero_of_safety",
    name: "安全卫士",
    desc: "保卫安全，抵制诈骗",
    icon: "🦸",
    type: "redeem",
    rarity: "epic",
    points: 500,
    isActive: true,
    createdAt: new Date()
  },
  {
    titleId: "chat_expert_10",
    name: "对话新手",
    desc: "完成10次对话",
    icon: "🗨️",
    type: "achievement",
    rarity: "common",
    achievementId: "chat_10",
    isActive: true,
    createdAt: new Date()
  },
  {
    titleId: "chat_expert_50",
    name: "对话达人",
    desc: "完成50次对话",
    icon: "🤖",
    type: "achievement",
    rarity: "rare",
    achievementId: "chat_50",
    isActive: true,
    createdAt: new Date()
  },
  {
    titleId: "chat_expert_100",
    name: "对话大师",
    desc: "完成100次对话",
    icon: "👑",
    type: "achievement",
    rarity: "epic",
    achievementId: "chat_100",
    isActive: true,
    createdAt: new Date()
  },
  {
    titleId: "learn_expert_10",
    name: "求知者",
    desc: "阅读10篇文章",
    icon: "📚",
    type: "achievement",
    rarity: "common",
    achievementId: "read_10",
    isActive: true,
    createdAt: new Date()
  },
  {
    titleId: "learn_expert_50",
    name: "博学者",
    desc: "阅读50篇文章",
    icon: "🎓",
    type: "achievement",
    rarity: "rare",
    achievementId: "read_50",
    isActive: true,
    createdAt: new Date()
  },
  {
    titleId: "learn_star_7",
    name: "自律之星",
    desc: "连续学习7天",
    icon: "⭐",
    type: "achievement",
    rarity: "rare",
    achievementId: "learn_7",
    isActive: true,
    createdAt: new Date()
  },
  {
    titleId: "sign_7_title",
    name: "七日勤勉",
    desc: "连续签到7天",
    icon: "📅",
    type: "achievement",
    rarity: "common",
    achievementId: "sign_7",
    isActive: true,
    createdAt: new Date()
  },
  {
    titleId: "sign_30_title",
    name: "签到大师",
    desc: "连续签到30天",
    icon: "🏆",
    type: "achievement",
    rarity: "rare",
    achievementId: "sign_30",
    isActive: true,
    createdAt: new Date()
  },
  {
    titleId: "sign_100_title",
    name: "百日传奇",
    desc: "连续签到100天",
    icon: "👑",
    type: "achievement",
    rarity: "epic",
    achievementId: "sign_100",
    isActive: true,
    createdAt: new Date()
  }
]

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    // 检查是否已有称号数据，避免重复初始化
    const existingTitles = await db.collection('titles').limit(1).get()
    
    if (existingTitles.data.length > 0) {
      return {
        success: false,
        message: "称号数据已存在，无需重复初始化"
      }
    }
    
    // 批量添加称号数据
    for (const title of titlesData) {
      await db.collection('titles').add({
        data: title
      })
    }
    
    return {
      success: true,
      message: `称号数据初始化完成，共添加 ${titlesData.length} 个称号`
    }
  } catch (err) {
    return {
      success: false,
      errMsg: err.message
    }
  }
}