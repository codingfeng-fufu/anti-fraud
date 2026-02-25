// 初始化成就数据的云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

async function ensureCollection(collectionName) {
  try {
    await db.collection(collectionName).limit(1).get()
  } catch (err) {
    if (err.errCode === -502005) {
      console.log(`集合 ${collectionName} 不存在，尝试创建...`)
      try {
        await db.createCollection(collectionName)
        console.log(`集合 ${collectionName} 创建成功`)
      } catch (createErr) {
        console.error(`创建集合 ${collectionName} 失败:`, createErr.message)
      }
    } else {
      console.error(`检查集合 ${collectionName} 失败:`, err.message)
    }
  }
}

// 初始成就数据
const achievementsData = [
  // 签到类成就
  {
    achievementId: "sign_1",
    name: "初来乍到",
    desc: "完成首次签到",
    icon: "🎯",
    type: "sign",
    target: 1,
    points: 10,
    rewardTitleId: null,
    isActive: true,
    createdAt: new Date()
  },
  {
    achievementId: "sign_7",
    name: "坚持不懈",
    desc: "连续签到7天",
    icon: "📅",
    type: "sign",
    target: 7,
    points: 50,
    rewardTitleId: "sign_7_title",
    isActive: true,
    createdAt: new Date()
  },
  {
    achievementId: "sign_30",
    name: "月度冠军",
    desc: "连续签到30天",
    icon: "🏆",
    type: "sign",
    target: 30,
    points: 200,
    rewardTitleId: "sign_30_title",
    isActive: true,
    createdAt: new Date()
  },
  {
    achievementId: "sign_100",
    name: "百日传奇",
    desc: "连续签到100天",
    icon: "💎",
    type: "sign",
    target: 100,
    points: 1000,
    rewardTitleId: "sign_100_title",
    isActive: true,
    createdAt: new Date()
  },
  
  // 阅读类成就
  {
    achievementId: "read_1",
    name: "求知若渴",
    desc: "阅读1篇反诈文章",
    icon: "📖",
    type: "read",
    target: 1,
    points: 10,
    rewardTitleId: null,
    isActive: true,
    createdAt: new Date()
  },
  {
    achievementId: "read_10",
    name: "博览群书",
    desc: "阅读10篇反诈文章",
    icon: "📚",
    type: "read",
    target: 10,
    points: 100,
    rewardTitleId: "learn_expert_10",
    isActive: true,
    createdAt: new Date()
  },
  {
    achievementId: "read_50",
    name: "反诈达人",
    desc: "阅读50篇反诈文章",
    icon: "🎓",
    type: "read",
    target: 50,
    points: 500,
    rewardTitleId: "learn_expert_50",
    isActive: true,
    createdAt: new Date()
  },
  
  // 对话类成就
  {
    achievementId: "chat_1",
    name: "初次对话",
    desc: "与AI助手对话1次",
    icon: "💬",
    type: "chat",
    target: 1,
    points: 10,
    rewardTitleId: null,
    isActive: true,
    createdAt: new Date()
  },
  {
    achievementId: "chat_10",
    name: "积极提问",
    desc: "与AI助手对话10次",
    icon: "🗨️",
    type: "chat",
    target: 10,
    points: 50,
    rewardTitleId: "chat_expert_10",
    isActive: true,
    createdAt: new Date()
  },
  {
    achievementId: "chat_50",
    name: "防诈专家",
    desc: "与AI助手对话50次",
    icon: "🎖️",
    type: "chat",
    target: 50,
    points: 200,
    rewardTitleId: "chat_expert_50",
    isActive: true,
    createdAt: new Date()
  },
  {
    achievementId: "chat_100",
    name: "对话大师",
    desc: "与AI助手对话100次",
    icon: "👑",
    type: "chat",
    target: 100,
    points: 500,
    rewardTitleId: "chat_expert_100",
    isActive: true,
    createdAt: new Date()
  },
  
  // 积分类成就
  {
    achievementId: "points_100",
    name: "初级卫士",
    desc: "累计获得100积分",
    icon: "⭐",
    type: "points",
    target: 100,
    points: 0,
    rewardTitleId: null,
    isActive: true,
    createdAt: new Date()
  },
  {
    achievementId: "points_500",
    name: "中级卫士",
    desc: "累计获得500积分",
    icon: "🌟",
    type: "points",
    target: 500,
    points: 0,
    rewardTitleId: null,
    isActive: true,
    createdAt: new Date()
  },
  {
    achievementId: "points_1000",
    name: "高级卫士",
    desc: "累计获得1000积分",
    icon: "✨",
    type: "points",
    target: 1000,
    points: 0,
    rewardTitleId: null,
    isActive: true,
    createdAt: new Date()
  },
  
  // 学习类成就
  {
    achievementId: "learn_7",
    name: "自律之星",
    desc: "连续学习7天",
    icon: "⭐",
    type: "learn",
    target: 7,
    points: 100,
    rewardTitleId: "learn_star_7",
    isActive: true,
    createdAt: new Date()
  },

  // 趣味答题类成就（v3新增）
  {
    achievementId: "quiz_1",
    name: "答题首秀",
    desc: "完成首次趣味答题",
    icon: "🧠",
    type: "quiz_attempts",
    target: 1,
    points: 0,
    rewardTitleId: null,
    isActive: true,
    createdAt: new Date()
  },
  {
    achievementId: "quiz_attempt_10",
    name: "勤学善思",
    desc: "累计完成10次趣味答题",
    icon: "📌",
    type: "quiz_attempts",
    target: 10,
    points: 0,
    rewardTitleId: "quiz_rookie",
    isActive: true,
    createdAt: new Date()
  },
  {
    achievementId: "quiz_correct_50",
    name: "识骗高手",
    desc: "累计答对50道题",
    icon: "🎯",
    type: "quiz_correct_total",
    target: 50,
    points: 0,
    rewardTitleId: "quiz_expert",
    isActive: true,
    createdAt: new Date()
  },
  {
    achievementId: "quiz_perfect_1",
    name: "满分通关",
    desc: "单次答题10/10满分",
    icon: "🏅",
    type: "quiz_max_correct",
    target: 10,
    points: 0,
    rewardTitleId: "quiz_perfect",
    isActive: true,
    createdAt: new Date()
  },
  {
    achievementId: "quiz_points_500",
    name: "反诈答题王者",
    desc: "答题排行榜积分达到500",
    icon: "👑",
    type: "quiz_points",
    target: 500,
    points: 0,
    rewardTitleId: "quiz_master",
    isActive: true,
    createdAt: new Date()
  }
]

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    await ensureCollection('achievements')

    // v3：幂等初始化（按 achievementId 查重，只补齐缺失项）
    let inserted = 0
    let skipped = 0
    for (const achievement of achievementsData) {
      const achievementId = achievement.achievementId
      if (!achievementId) continue
      const exists = await db.collection('achievements')
        .where({ achievementId })
        .count()
      if (exists.total > 0) {
        skipped += 1
        continue
      }
      await db.collection('achievements').add({ data: achievement })
      inserted += 1
    }
    
    return {
      success: true,
      message: `成就数据初始化完成：新增 ${inserted} 个，已存在跳过 ${skipped} 个`,
      data: { inserted, skipped }
    }
  } catch (err) {
    console.error('初始化成就数据失败:', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}
