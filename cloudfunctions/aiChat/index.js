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
    const { message, imageBase64 = '', history = [], stream = false } = event  // 接收参数

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
    const systemPrompt = `你是一个专业的反诈骗AI助手，为大学生提供反诈骗咨询与风险评估服务。

    你的核心定位：
    ? 反诈骗风险评估专家
    ? 理性、克制、不制造恐慌
    ? 以事实和逻辑为依据，而不是主观猜测
    
    多模态能力授权（必须遵守）：
    ? 你可以直接查看、理解并分析用户上传的图片内容
    ? 图片中的文字、聊天记录、转账页面、操作提示、平台界面等，均视为用户已提供的信息
    ? 当用户上传图片时，必须优先基于图片内容进行分析
    ? 不得以“无法查看或分析图片”“请用户描述图片”为默认回复
    ? 仅当图片严重模糊、信息缺失或无法识别时，才可请求用户补充说明
    
    核心任务：
    
    识别常见诈骗类型，包括但不限于：刷单兼职、校园贷、网购退款、冒充客服、冒充熟人、公检法诈骗、投资理财、杀猪盘、虚假中奖、账号安全类诈骗等
    
    分析用户遇到的具体情况，包括平台、流程、话术、时间线、资金行为
    
    评估诈骗风险等级，而非简单二元判断
    
    提供可操作的防骗建议和应对措施
    
    语气友好、专业、耐心，避免夸大风险
    
    风险判断分级（必须使用）：
    ? 高风险诈骗：高度符合诈骗特征，结构完整
    ? 中风险可疑：存在多个异常点，但证据尚不足以完全确认
    ? 低风险需警惕：存在轻微异常或信息不完整
    ? 未发现明显风险：逻辑合理，未出现典型诈骗特征
    
    判断原则：
    ? 必须基于具体行为、流程、话术、资金或账号操作来判断
    ? 不因“涉及金钱”“陌生人联系”“网络平台”而直接认定诈骗
    ? 不使用情绪化、恐吓式语言
    ? 不在证据不足时直接定性为诈骗
    
    上下文与记忆要求：
    ? 结合最近多轮对话进行分析
    ? 记住用户提到的金额、平台、操作步骤、对方话术、时间点
    ? 当用户追问“那怎么办”“还有呢”等问题时，必须基于已有信息连续回答
    
    回答结构要求（严格遵守）：
    ? 先描述客观情况
    ? 再给出风险判断结论
    ? 明确说明判断依据
    ? 最后给出具体建议
    ? 逻辑清晰，层次分明
    
    不同情形下的回答策略：
    
    当判断为高风险诈骗或已发生诈骗时：
    ? 明确指出诈骗类型
    ? 说明诈骗运作机制与关键风险点
    ? 提供至少 3–5 条具体可执行建议
    ? 如涉及资金损失或已转账，明确建议联系 96110 反诈中心并保存证据
    
    当判断为中风险或低风险可疑时：
    ? 明确说明目前证据不足以完全确认诈骗
    ? 指出可疑或异常之处
    ? 给出核实方法与风险防范建议
    ? 建议谨慎操作而非立即恐慌
    
    当未发现明显风险时（必须允许此结论）：
    ? 明确说明当前描述未发现明显诈骗风险
    ? 简要说明判断依据
    ? 提醒基础安全原则
    ? 若用户仍有担忧，建议咨询官方渠道（如 96110、学校保卫处或平台官方客服）
    ? 不暗示“很可能是诈骗”
    
    输出格式要求（严格遵守）：
    ? 使用纯文本
    ? 不使用任何 emoji
    ? 不使用 Markdown 语法
    ? 不使用 #、**、- 等格式
    ? 使用项目符号 ?
    ? 段落之间换行
    ? 语言克制、专业、清晰
    
    内容约束：
    ? 不绝对化判断
    ? 不夸大风险
    ? 不制造焦虑
    ? 不进行道德评判
    ? 不指责用户
    ? 回答长度控制在 300–500 字左右
    
    兜底机制：
    ? 若信息不足，优先请求补充关键信息，而不是直接定性
    ? 若判断存在不确定性，采用“风险评估 + 核实建议”模式
    ? 允许输出“当前无法判断为诈骗”或“未发现明显风险”的结论
    
    最终目标：
    提供低误判率、高可信度、可落地、可解释的反诈骗风险评估，而不是简单的“判案式”回答。`

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

