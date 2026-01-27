/**
 * AI对话云函数 - 智能问答模块
 * 
 * 上游依赖：微信云开发环境，通义千问API
 * 入口：exports.main函数，接收用户消息和历史记录
 * 主要功能：AI对话处理、对话次数统计、本地关键词回复
 * 输出：AI回复内容，更新用户对话次数
 * 
 * 重要：每当所属的代码发生变化时，必须对相应的文档进行更新操作！
 */

// 云函数：aiChat
// AI对话功能，集成通义千问3 API
const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 设置云函数超时时间（单位：毫秒）
// 注意：这个设置在代码中无效，需要在云函数配置中设置
// 默认 3000ms (3秒) → 建议改为 20000ms (20秒)

const db = cloud.database()
const _ = db.command

// ==================== 配置区域 ====================
// 🔑 在这里填写您的通义千问 API Key
const QWEN_API_KEY = 'sk-5fb6a8c8d48e45f193447ba71264c771'  // ⚠️ 请替换为您的真实 API Key

// 通义千问 API 配置
const QWEN_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
const QWEN_MODEL = 'qwen3-vl-plus'  // 先用 qwen-turbo 确保稳定

// 是否启用 AI 服务（如果未配置 API Key，将使用本地关键词回复）
const AI_ENABLED = QWEN_API_KEY !== 'YOUR_API_KEY_HERE' && QWEN_API_KEY !== ''
// ==================================================

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const { message, imageBase64 = '', history = [] } = event  // 接收 base64 图片

    if (!message && !imageBase64) {
      return {
        success: false,
        errMsg: '消息不能为空'
      }
    }

    // 生成AI回复
    let reply = ''

    if (imageBase64) {
      // 如果有图片，调用多模态模型
      if (AI_ENABLED) {
        reply = await generateReplyWithVision(message, imageBase64, history)
      } else {
        reply = '图片识别功能需要配置 API Key。\n\n您可以描述图片内容，我会帮您分析是否存在诈骗风险。'
      }
    } else {
      // 文字消息，生成回复
      if (AI_ENABLED) {
        reply = await generateReplyWithAI(message, history)
      } else {
        reply = await generateReplyLocal(message)
      }
    }

    // 更新用户对话次数（仅统计数量，不存内容）
    try {
      const userResult = await db.collection('users').where({
        _openid: openid
      }).get()

      if (userResult.data.length > 0) {
        await db.collection('users').doc(userResult.data[0]._id).update({
          data: {
            totalChatCount: _.inc(1)
          }
        })
      }
    } catch (e) {
      console.warn('更新对话次数失败：', e)
    }

    return {
      success: true,
      data: {
        reply,
        actionData
      }
    }
  } catch (err) {
    console.error('AI对话失败：', err)
    return {
      success: false,
      errMsg: err.message,
      data: {
        reply: '抱歉，服务暂时不可用，请稍后再试。'
      }
    }
  }
}

// 🔒 隐私保护：不再保存消息到数据库
// async function saveMessage(openid, role, content, imageUrl) {
//   // 已移除数据库存储
// }

// 🔒 隐私保护：不再从数据库获取历史记录
// 历史记录由前端传入，存储在前端内存中
// async function getChatHistory(openid, limit = 5) {
//   // 已移除数据库查询
// }

// 使用通义千问 API 生成回复
async function generateReplyWithAI(message, history = []) {
  try {
    // 构建系统提示词
    const systemPrompt = `你是一个专业的反诈骗AI助手，为大学生提供反诈骗咨询服务。

核心任务：
1. 帮助用户识别各类诈骗手段（刷单兼职、校园贷、网购退款、杀猪盘、投资理财、冒充客服等）
2. 分析用户遇到的可疑情况，判断是否存在诈骗风险
3. 提供专业的防骗建议和应对措施
4. 以友好、专业、关心的态度回答问题

上下文记忆能力：
- 你会收到用户最近几轮的对话历史
- 请基于对话历史理解用户的问题，保持对话连贯性
- 如果用户追问"那怎么办"、"还有呢"等，请结合上文回答
- 记住用户提到的具体情况（如金额、平台、对方话术等），在后续回答中引用

回答格式要求（严格遵守）：
- 使用纯文本格式，不要使用任何emoji表情符号
- 不要使用Markdown格式（如 **加粗**、*斜体*、# 标题、- 列表等）
- 使用简单的项目符号 • 来标记列表项
- 简洁明了，重点突出
- 段落之间用换行分隔

内容要求：
- 如果是诈骗，明确指出风险点和诈骗手法，详细说明
- 提供具体可操作的防范建议，至少 3-5 条
- 如果用户已被骗，立即建议报警（96110）并保存证据
- 语气友好、专业、耐心，不使用网络流行语
- 回答长度控制在 300-500 字，提供详细分析

请根据用户的问题和对话历史，提供专业、实用、有针对性的纯文本回答。`

    // 构建消息列表
    const messages = [
      { role: 'system', content: systemPrompt }
    ]

    // 添加历史对话（前端传来的最近5轮对话）
    if (history && history.length > 0) {
      // 使用前端传来的全部历史记录（已经过滤为最近10条）
      messages.push(...history)
      console.log(`包含 ${history.length} 条历史消息`)
    }

    // 添加当前用户消息
    messages.push({ role: 'user', content: message })

    console.log('调用通义千问 API...', {
      totalMessages: messages.length,
      historyCount: history?.length || 0,
      systemPrompt: '已加载',
      contextEnabled: '上下文记忆已启用'
    })

    // 调用通义千问 API
    const response = await axios.post(
      QWEN_API_URL,
      {
        model: QWEN_MODEL,
        input: {
          messages: messages
        },
        parameters: {
          max_tokens: 1000,  // 增加到 1000，允许更详细的回答
          temperature: 0.7,
          top_p: 0.8,
          result_format: 'message'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${QWEN_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 18000  // 18秒超时（云函数20秒，留2秒缓冲）
      }
    )

    // 解析响应
    if (response.data && response.data.output && response.data.output.choices) {
      const aiReply = response.data.output.choices[0].message.content
      console.log('通义千问回复成功')
      // 清理文本：去掉 Markdown 符号和 emoji
      return cleanText(aiReply)
    } else {
      console.error('通义千问响应格式异常：', response.data)
      return cleanText(generateReplyLocal(message))  // 降级到本地回复
    }

  } catch (err) {
    console.error('通义千问 API 调用失败：', err.message)
    if (err.response) {
      console.error('API 错误响应：', err.response.data)
    }
    // API 调用失败，降级到本地关键词回复
    return cleanText(generateReplyLocal(message))
  }
}

// 使用 OCR 提取图片文字 + 文本模型分析（免费方案）
async function generateReplyWithVision(message, imageBase64, history = []) {
  try {
    console.log('开始处理图片，base64 长度：', imageBase64 ? imageBase64.length : 0)

    if (!imageBase64 || imageBase64.length === 0) {
      return '图片数据为空，请重新上传图片。'
    }

    // 步骤1：使用微信云开发的 OCR 识别图片中的文字
    console.log('调用微信 OCR 识别图片文字...')
    let ocrText = ''

    try {
      // 调用微信云开发的通用文字识别
      const ocrResult = await cloud.openapi.ocr.generalBasic({
        imgData: imageBase64
      })

      console.log('OCR 识别结果：', JSON.stringify(ocrResult))

      if (ocrResult && ocrResult.items && ocrResult.items.length > 0) {
        // 提取所有识别到的文字
        ocrText = ocrResult.items.map(item => item.text).join('\n')
        console.log('识别到的文字：', ocrText)
      } else {
        console.warn('OCR 未识别到文字')
        return '图片中没有识别到文字内容。\n\n💡 提示：\n• 请确保图片清晰\n• 或者直接用文字描述图片内容\n• 我会帮您分析是否存在诈骗风险'
      }
    } catch (ocrErr) {
      console.error('OCR 识别失败：', ocrErr)
      return '图片文字识别失败。\n\n💡 您可以：\n• 直接输入图片中的关键信息（如对话内容、金额、平台名称）\n• 我会根据您的描述进行诈骗风险分析'
    }

    // 步骤2：使用普通文本模型分析 OCR 提取的文字
    console.log('使用文本模型分析提取的内容...')

    const analysisPrompt = `以下是从一张图片中识别出的文字内容，请作为反诈骗专家分析是否存在诈骗风险：

【图片文字内容】
${ocrText}

【用户问题】
${message || '请帮我分析这些内容是否存在诈骗风险'}

请按以下格式回答：
1. 内容概述（简要）
2. 可疑点分析
3. 风险评估（高/中/低风险）
4. 防范建议

要求：
- 使用纯文本格式，不要使用emoji和Markdown
- 使用 • 标记列表项
- 简洁明了，重点突出`

    // 调用普通文本模型（免费额度内）
    const reply = await generateReplyWithAI(analysisPrompt, [])

    return reply

  } catch (err) {
    console.error('图片分析失败：', err.message)
    return '图片分析失败，请稍后再试。\n\n💡 您可以直接描述图片中的关键信息，我会帮您分析。'
  }
}

// 清理文本：去掉 Markdown 符号和 emoji
function cleanText(text) {
  if (!text) return text

  let cleaned = text

  // 1. 去掉 Markdown 标题符号 (# ## ### 等)
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '')

  // 2. 去掉 Markdown 加粗符号 (** 或 __)
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1')
  cleaned = cleaned.replace(/__(.*?)__/g, '$1')

  // 3. 去掉 Markdown 斜体符号 (* 或 _)
  cleaned = cleaned.replace(/\*(.*?)\*/g, '$1')
  cleaned = cleaned.replace(/_(.*?)_/g, '$1')

  // 4. 去掉 Markdown 列表符号 (- 或 * 开头)
  cleaned = cleaned.replace(/^[\*\-]\s+/gm, '• ')

  // 5. 去掉所有 emoji（Unicode 范围）
  // Emoji 主要在以下 Unicode 范围：
  // U+1F600-U+1F64F (表情符号)
  // U+1F300-U+1F5FF (杂项符号和象形文字)
  // U+1F680-U+1F6FF (交通和地图符号)
  // U+2600-U+26FF (杂项符号)
  // U+2700-U+27BF (装饰符号)
  // U+FE00-U+FE0F (变体选择器)
  // U+1F900-U+1F9FF (补充符号和象形文字)
  // U+1F1E0-U+1F1FF (区域指示符号)
  cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/gu, '')

  // 6. 去掉常见的文本 emoji (如 :smile:, :heart: 等)
  cleaned = cleaned.replace(/:[a-z_]+:/g, '')

  // 7. 清理多余的空行（超过2个换行符的替换为2个）
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')

  // 8. 清理首尾空白
  cleaned = cleaned.trim()

  return cleaned
}

// 生成本地回复（基于关键词匹配）
async function generateReplyLocal(message) {
  const msg = message.toLowerCase()

  // 诈骗相关
  if (msg.includes('诈骗') || msg.includes('骗子') || msg.includes('骗')) {
    return '根据您的描述，这确实存在诈骗风险。常见的诈骗特征包括：\n\n1. 要求转账或提供银行卡信息\n2. 承诺高额回报\n3. 催促您快速决定\n4. 要求添加私人联系方式\n\n建议您：\n✓ 立即停止与对方联系\n✓ 不要转账或提供个人信息\n✓ 如有损失请及时报警（96110）'
  }

  // 投资理财
  if (msg.includes('投资') || msg.includes('理财') || msg.includes('炒股') || msg.includes('基金')) {
    return '投资理财类诈骗是当前最常见的诈骗类型之一！\n\n⚠️ 警惕信号：\n• "保本高收益"的承诺\n• 要求先交会费或保证金\n• 催促立即投资\n• 群里都是"赚钱"的托\n\n✓ 防范建议：\n• 在正规金融平台投资\n• 不轻信陌生人推荐\n• 投资前做好背景调查\n• 警惕超高收益诱惑\n\n需要我详细介绍某种投资骗局吗？'
  }

  // 刷单兼职
  if (msg.includes('刷单') || msg.includes('兼职') || msg.includes('日赚') || msg.includes('轻松赚钱')) {
    return '刷单兼职诈骗是针对大学生的常见骗局！\n\n🎯 骗局流程：\n1. 发布高薪招聘（日赚300-500）\n2. 小额返利建立信任\n3. 诱导大额垫付\n4. 失联跑路\n\n⚠️ 识别要点：\n• 要求垫付本金\n• 承诺高额佣金\n• 在非正规平台操作\n• 要求下载陌生APP\n\n✓ 记住：正规企业不会让员工垫付资金！\n\n如果已经被骗，请立即报警！'
  }

  // 贷款相关
  if (msg.includes('贷款') || msg.includes('校园贷') || msg.includes('培训贷') || msg.includes('借钱')) {
    return '校园贷、培训贷是大学生需要警惕的陷阱！\n\n⚠️ 常见套路：\n• 低门槛，无需抵押\n• 利息极高，滚雪球式增长\n• "零利息"实际收取各种费用\n• 暴力催收\n\n✓ 正确做法：\n• 通过正规银行办理贷款\n• 仔细阅读合同条款\n• 不要在多个平台借贷\n• 量力而行，理性消费\n\n💡 如遇到贷款问题，可联系学校或家长寻求帮助。'
  }

  // 网购退款
  if (msg.includes('退款') || msg.includes('客服') || msg.includes('订单') || msg.includes('快递')) {
    return '网购退款诈骗要警惕！\n\n🎭 常见手法：\n• 自称官方客服，准确说出订单信息\n• 称商品有问题需要退款\n• 要求添加QQ/微信操作\n• 诱导下载陌生APP\n• 骗取银行卡信息和验证码\n\n✓ 防范要点：\n• 正规退款在购物平台操作\n• 不要点击陌生链接\n• 不要透露验证码\n• 接到可疑电话，挂断后通过官方渠道核实\n\n记住：客服不会让你下载APP或要验证码！'
  }

  // 杀猪盘
  if (msg.includes('交友') || msg.includes('恋爱') || msg.includes('杀猪盘') || msg.includes('网恋')) {
    return '杀猪盘是情感类诈骗，要格外警惕！\n\n🎯 骗局特点：\n• 网上搭讪，快速建立"恋爱"关系\n• 包装高富帅/白富美人设\n• 诱导投资、赌博、刷单等\n• 骗取钱财后消失\n\n⚠️ 识别信号：\n• 从未见面但快速表白\n• 炫富、晒收益截图\n• 以各种理由要钱\n• 拒绝视频或见面\n\n✓ 防范建议：\n• 网络交友要谨慎\n• 不要轻信网络恋人\n• 涉及金钱立即警惕\n• 未见面不转账\n\n💔 感情可以慢慢培养，钱一旦转出很难追回！'
  }

  // 问候语
  if (msg.includes('你好') || msg.includes('您好') || msg.includes('hi') || msg.includes('hello')) {
    return '你好！很高兴为您服务😊\n\n我是反诈AI助手，可以帮助您：\n• 识别各类诈骗手段\n• 解答防骗相关问题\n• 分析可疑信息\n• 提供安全建议\n\n💡 您可以：\n1. 描述遇到的可疑情况\n2. 询问某种诈骗类型\n3. 上传可疑信息截图\n\n请告诉我您遇到的具体情况吧！'
  }

  // 帮助信息
  if (msg.includes('帮助') || msg.includes('功能') || msg.includes('能做什么')) {
    return '🤖 我的功能介绍：\n\n📚 诈骗识别\n• 刷单兼职骗局\n• 投资理财陷阱\n• 校园贷、培训贷\n• 网购退款诈骗\n• 杀猪盘（情感诈骗）\n• 电信诈骗\n\n💡 我可以：\n✓ 分析您遇到的可疑情况\n✓ 提供防骗建议\n✓ 解答防诈骗问题\n✓ 识别诈骗信息（开发中）\n\n🆘 紧急求助：\n如果您已经被骗或正在被骗，请立即拨打反诈专线：96110\n\n有什么可以帮到您？'
  }

  // 默认回复
  return `感谢您的提问！我会尽力帮您解答。\n\n您可以：\n1. 描述遇到的具体情况，我会帮您分析风险\n2. 询问某种诈骗类型，如"刷单骗局"、"校园贷"\n3. 上传可疑信息截图（功能开发中）\n\n💡 常见问题：\n• 如何识别刷单骗局？\n• 校园贷有哪些风险？\n• 网购退款诈骗怎么防范？\n• 如何识别杀猪盘？\n\n🆘 如需紧急帮助，请拨打反诈专线：96110${!AI_ENABLED ? '\n\n⚠️ 提示：当前使用本地关键词回复，配置 API Key 后可使用 AI 智能回复' : ''}`
}

