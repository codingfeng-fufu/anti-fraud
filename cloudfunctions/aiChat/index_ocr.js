// 免费版图片识别方案：使用微信 OCR + 文本模型分析

// 使用 OCR 提取图片文字 + 文本模型分析（免费方案）
async function generateReplyWithVision_OCR(message, imageBase64, history = []) {
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

// 导出函数
module.exports = {
    generateReplyWithVision_OCR
}
