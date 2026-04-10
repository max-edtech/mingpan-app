/**
 * Claude API — 人生劇本生成
 * 把結構化命盤數據轉為自然語言敘事
 */

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-opus-4-6';

/**
 * 把命盤分析結果轉成給 Claude 的提示
 */
function buildPrompt(baziData) {
  const { pillars, riZhu, qishi, mainLine, interactions, dayuns, currentDayun } = baziData;

  const pillarStr = pillars.map(p => `${p.pos}柱：${p.gan}${p.zhi}`).join('　');
  const mainStructures = mainLine?.mainLine?.map(s => `${s.type}（${s.subtype}）—${s.desc}`).join('\n  ') ?? '未計算';
  const topDayuns = dayuns?.slice(0, 5).map(d => `${d.age}歲：${d.gan}${d.zhi}`).join('　') ?? '';

  return `你是一位精通段建業盲派八字的命理師。請用「人生劇本」的形式，以詩意且直接的語言解讀以下命盤，讓當事人「看見」自己的人生結構。

【四柱】${pillarStr}
【日主】${riZhu}　【氣勢】${qishi?.verdict}（${qishi?.host}為主位）
【主線做功結構】
  ${mainStructures}
【前五步大運】${topDayuns}

請按以下框架輸出（繁體中文，每段不超過120字）：

## 命盤核心意象
（用1-2個自然場景意象描述此命盤的整體能量）

## 你的人生主題
（這個人的核心命題是什麼？他/她的天賦和命運方向）

## 做功主線解讀
（主線做功結構意味著什麼？具體表現在哪些人生領域）

## 運勢軌跡
（大運的主要轉折點和關鍵時期）

## 給命主的話
（一段直接、有溫度的總結，像在對當事人說話）

重要：不要輸出表格或乾燥的命理術語堆砌。要讓普通人讀了有「被看見」的感覺。`;
}

/**
 * 調用 Claude API 生成人生劇本
 * @param {string} apiKey  Anthropic API Key
 * @param {object} baziData 命盤分析結果
 * @param {function} onChunk 流式回調 (chunk: string) => void
 * @returns {Promise<string>} 完整報告文字
 */
export async function generateLifeScript(apiKey, baziData, onChunk) {
  const prompt = buildPrompt(baziData);

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      stream: true,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `API 錯誤 ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'content_block_delta') {
          const chunk = parsed.delta?.text ?? '';
          fullText += chunk;
          onChunk?.(chunk);
        }
      } catch { /* 忽略解析錯誤 */ }
    }
  }

  return fullText;
}

/**
 * 測試 API Key 是否有效
 */
export async function testApiKey(apiKey) {
  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'ping' }],
    }),
  });
  return response.ok;
}
