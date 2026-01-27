/**
 * AI对话云函数 - 智能问答模块
 *
 * 上游依赖：微信云开发环境，通义千问多模态API，trackAction云函数
 * 入口：exports.main函数，接收用户消息、历史记录和图片
 * 主要功能：AI对话处理、对话次数统计、图片分析、积分和成就解锁
 * 输出：AI回复内容，更新用户对话次数、积分和成就
 *
 * 重要：每当所属的代码发生变化时，必须对相应的文档进行更新操作！
 */

// 云函数：aiChat
// AI对话功能，集成通义千问多模态模型（qwen-vl-plus）
// 支持文本对话和图片分析，全部请求使用多模态模型
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
const QWEN_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'
const QWEN_MODEL = 'qwen-vl-plus'  // 多模态模型
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

    // 生成AI回复（全部使用多模态模型）
    const reply = await generateReplyWithVision(message, imageBase64, history)

    // 调用 trackAction 云函数来记录用户行为和获取积分/成就
    let actionData = null
    try {
      const trackResult = await cloud.callFunction({
        name: 'trackAction',
        data: {
          openid,
          action: 'chat',
          details: {
            hasImage: !!imageBase64,
            messageLength: message?.length || 0
          }
        }
      })

      if (trackResult.result && trackResult.result.success) {
        actionData = trackResult.result.data
        console.log('trackAction 调用成功:', actionData)
      } else {
        console.warn('trackAction 调用失败:', trackResult.result?.errMsg)
      }
    } catch (trackErr) {
      console.warn('trackAction 调用异常:', trackErr)
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
        reply: '抱歉，服务暂时不可用，请稍后再试。',
        actionData: null
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

// 使用多模态模型直接处理文本和图片
async function generateReplyWithVision(message, imageBase64, history = []) {
  try {
    console.log('调用多模态模型，base64 长度：', imageBase64 ? imageBase64.length : 0)

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

请根据用户的问题、对话历史和图片（如果有），提供专业、实用、有针对性的纯文本回答。`

    // 构建消息列表
    const messages = [
      { role: 'system', content: systemPrompt }
    ]

    // 添加历史对话（前端传来的最近5轮对话）
    if (history && history.length > 0) {
      messages.push(...history)
      console.log(`包含 ${history.length} 条历史消息`)
    }

    // 添加当前用户消息
    const userMessage = {
      role: 'user',
      content: []
    }

    // 添加图片（如果有）- 使用 qwen-vl 格式
    if (imageBase64) {
      userMessage.content.push({
        type: 'image',
        image: `data:image/jpeg;base64,${imageBase64}`
      })
    }

    // 添加文本内容
    if (message) {
      userMessage.content.push({ type: 'text', text: message })
    } else if (imageBase64) {
      // 如果只有图片没有文本，添加默认提示
      userMessage.content.push({
        type: 'text',
        text: '请帮我分析这张图片是否存在诈骗风险'
      })
    }

    messages.push(userMessage)

    console.log('调用多模态模型 API...', {
      totalMessages: messages.length,
      hasImage: !!imageBase64,
      historyCount: history?.length || 0
    })

    // 调用通义千问多模态 API（原生 Dashscope 格式）
    const response = await axios.post(
      QWEN_API_URL,
      {
        model: QWEN_MODEL,
        input: {
          messages: messages
        },
        parameters: {
          max_tokens: 1000,
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
        timeout: 18000
      }
    )

    // 解析响应（原生 Dashscope 格式）
    console.log('========== AI 原始响应 ==========')
    console.log(JSON.stringify(response.data, null, 2))
    console.log('==================================')

    if (response.data && response.data.output && response.data.output.choices) {
      const choice = response.data.output.choices[0]
      console.log('choices[0]:', JSON.stringify(choice))

      if (choice.message && choice.message.content) {
        const aiReply = choice.message.content
        console.log('AI 回复内容类型:', typeof aiReply)
        console.log('AI 回复内容:', aiReply)

        // 处理多模态响应（content 可能是数组）
        let finalContent = aiReply
        if (Array.isArray(aiReply)) {
          finalContent = aiReply
            .map(item => {
              // 兼容两种格式：{type: 'text', text: '...'} 或 {text: '...'}
              if (item.text) return item.text
              return ''
            })
            .filter(text => text.length > 0)
            .join('\n')
        }

        console.log('处理后的内容:', finalContent)
        console.log('多模态模型回复成功')
        return cleanText(finalContent)
      } else {
        console.error('消息格式异常:', choice.message)
        throw new Error('消息格式异常')
      }
    } else {
      console.error('多模态模型响应格式异常：', response.data)
      throw new Error('模型响应格式异常')
    }

  } catch (err) {
    console.error('多模态模型调用失败：', err.message)
    if (err.response) {
      console.error('API 错误响应：', err.response.data)
    }
    throw err
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
  cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/gu, '')

  // 6. 去掉常见的文本 emoji (如 :smile:, :heart: 等)
  cleaned = cleaned.replace(/:[a-z_]+:/g, '')

  // 7. 清理多余的空行（超过2个换行符的替换为2个）
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')

  // 8. 清理首尾空白
  cleaned = cleaned.trim()

  return cleaned
}

