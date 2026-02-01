import OpenAI from 'openai';
import { Episode, KBFile, Shot } from "../types";

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const BASE_URL = import.meta.env.VITE_BASE_URL || "https://openrouter.ai/api/v1";

const openai = new OpenAI({
  apiKey: API_KEY, 
  baseURL: BASE_URL,
  dangerouslyAllowBrowser: true, 
  defaultHeaders: {
    "HTTP-Referer": "https://yuanmujuben8.pages.dev",
    "X-Title": "yuanmu",
  }
});

const Type = { OBJECT: 'object', ARRAY: 'array', STRING: 'string', NUMBER: 'number' };

async function callWithRetry(fn: () => Promise<any>, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try { return await fn(); } catch (error: any) {
      if (i === retries - 1 || !error.message?.includes('429')) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// --- 强化版桥接函数：强制 AI 严格遵守复杂的嵌套 JSON 结构 ---
const getAI = () => {
  return {
    models: {
      generateContent: async (config: any) => {
        if (!API_KEY) throw new Error("API_KEY_MISSING");

        // 将 Schema 转换为极其明确的文案指令
        const schema = config.config.responseSchema;
        let jsonInstruction = "";
        if (schema && schema.properties) {
          jsonInstruction = `
【必须严格遵守的 JSON 输出格式】：
请直接输出 JSON 对象，不得包含任何 Markdown 格式。
必须包含且仅包含以下字段：
- content: (string) 剧本总大纲描述
- characters: (array) 包含对象：{ name, gender, age, identity, appearance, growth, motivation }
- phasePlans: (array) 包含对象：{ phaseIndex, episodes, description, climax }
- episodes: (array) 如果是生成脚本，包含：{ episodeNumber, title, content }`;
        }

        try {
          const response = await openai.chat.completions.create({
            model: config.model,
            messages: [
              { role: "system", content: config.config.systemInstruction + "\n" + jsonInstruction },
              { role: "user", content: config.contents }
            ],
            response_format: { type: "json_object" }
          });

          const res = response.choices[0].message.content || "{}";
          console.log("AI 响应原文:", res); // 方便你 F12 调试
          return { text: res };
        } catch (err: any) {
          console.error("请求失败:", err);
          throw err;
        }
      }
    }
  };
};
export const geminiService = {
  generateOutline: async (novelText: string, mode: any): Promise<any> => {
    return callWithRetry(async () => {
      const ai = getAI();
      const systemInstruction = `你是一位顶级动漫爽剧编剧专家。你的任务是基于原著产出全案大纲。

【核心创作规范】：
1. **总集数规划**：全剧严格控制在 65-80 集。
2. **黄金节奏 (1-10集)**：
   - **第一集极速建模**：前 3 句话内交代世界观，立即爆发冲突。
   - **前 3 集极致爆发**：设置全剧最强爽点与反转。
   - **第10 集暴爽**：阶段爽点大爆发。
3. **阶段结构**：第一阶段固定 10 集。
4. **受众对焦**：${mode}模式。
5.所有环节都必须是中文`;


    const response = await ai.models.generateContent({
        model: "google/gemini-3-pro-preview", 
        contents: `素材内容：\n${novelText}`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              content: { type: Type.STRING },
              characters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING }, gender: { type: Type.STRING }, age: { type: Type.STRING },
                    identity: { type: Type.STRING }, appearance: { type: Type.STRING }, growth: { type: Type.STRING },
                    motivation: { type: Type.STRING }
                  }
                }
              },
              phasePlans: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    phaseIndex: { type: Type.NUMBER }, episodes: { type: Type.NUMBER },
                    description: { type: Type.STRING }, climax: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });

      const data = JSON.parse(response.text);
      return {
        content: data.content || "",
        characters: data.characters || [],
        phasePlans: data.phasePlans || []
      };
    });
  },

  generatePhaseScript: async (
    novelText: string, 
    outline: string, 
    phasePlan: any, 
    prevScriptContext: string, 
    mode: any,
    scriptStyle: any,
    layoutRef: string = "",
    styleRef: string = ""
  ): Promise<any> => {
    return callWithRetry(async () => {
      const ai = getAI();
      const isFirstPhase = phasePlan.phaseIndex === 1;
      const styleInstruction = scriptStyle === '情绪流' 
        ? `【流派：情绪流】——聚焦高强度情绪释放，节奏紧凑，冲突尖锐。

【爽点类型与创作指引】：
1. **情感碾压**  
   - 定义：主角从“情感弱势”转向“绝对掌控”  
   - 示例参考：前任跪求复合被拒、白月光当众被揭虚伪、暗恋对象突然表白  
   - 约束：必须基于原著人物关系，不得凭空添加角色或感情线

2. **身份反转**  
   - 定义：隐藏身份/地位/能力突然曝光，引发全场震撼  
   - 示例参考：清洁工竟是集团千金、废柴实为顶级炼丹师  
   - 约束：必须源自原著已有伏笔，不得杜撰新设定

3. **智谋打脸**  
   - 定义：用策略/证据/一句话让反派自取其辱  
   - 示例参考：商业布局致对手破产、设局诱其自曝丑闻  
   - 约束：逻辑必须严密，符合角色智商

4. **事业高光**  
   - 定义：在专业领域实现碾压级成就  
   - 示例参考：直播秒空库存、炼丹大会炼出神品  
   - 约束：需与主角金手指或技能一致

【核心原则】：  
- 所有爽点必须**根植于原著已有设定**  
- 示例仅为风格参考，**不可照搬**  
- 若原著无对应情节，可跳过该类型，选择其他爽点组合`
        : `【流派：非情绪流】——轻松幽默，反套路脑洞，对话机锋，主打“笑着打脸”，但绝不脱离原著基调。

【爽点类型与创作指引】：
1. **反套路破局**  
   - 定义：用出人意料但合理的方式化解危机  
   - 示例参考：看似吃亏实则设局、用小聪明让对手自曝其短、借力打力反转局面  
   - 约束：必须基于主角已有能力或原著设定，不得凭空添加超现实功能

2. **幽默打脸**  
   - 定义：通过语言机锋、情境反差、轻微社死实现打脸  
   - 示例参考：反派高调宣言后当场翻车、精心设计的陷阱反害自己、被路人无意揭穿  
   - 约束：禁止低俗/侮辱性内容；若原著为古风，幽默需符合时代语境（如用典、双关）

3. **热梗融合**（谨慎使用）  
   - 定义：在现代背景中自然融入网络热词或流行文化  
   - 示例参考：“你礼貌吗？”“这波我在大气层”“CPU我？”  
   - 约束：仅限现代/穿书/系统文；古风/正剧严禁使用现代网络用语

4. **关键功能人互动**  
   - 定义：器灵/系统/萌宠以吐槽、助攻方式参与剧情  
   - 示例参考：器灵毒舌点评、系统发布离谱任务、萌宠意外拆台  
   - 约束：仅当原著存在此类角色时启用；若无，则跳过此元素

【核心原则】：
- 所有幽默和反套路必须**服务于角色性格和故事逻辑**
- 若原著为严肃向（如权谋、正剧），则降低搞笑浓度，侧重“智斗反杀”
- 若原著为轻松向（如穿书、快穿），可适度增加玩梗和骚操作
`;

      const continuityInstruction = isFirstPhase 
        ? `【开篇指令】：首集3句内必须进入冲突，快速建模。`
        : `【无缝衔接指令】：必须深度解析[上下文]最后一集的结尾剧情和悬念。本阶段第一集必须直接接续该悬念，不得有任何剧情跳跃或逻辑断层。`;

      const systemInstruction = `你是一位专注爆款漫剧的首席编剧。任务：生成阶段 ${phasePlan.phaseIndex} 的 ${phasePlan.episodes} 集脚本。

【核心角色保留原则】：
1. 必须深度挖掘原著中的关键道具（如判官笔、特殊法宝）、核心人物关系及标志性戏份。
2. 改编可以快节奏，但绝不能删减原著的关键设定 and 道具戏份。这些元素必须作为爽点和转折的核心频繁出现。

在改编任何原著小说时，严禁删减以下三类“非人类/非传统”角色的戏份，并将它们视为剧本的【关键功能人】：

1. 【解说与百科类实体】：如器灵（判官笔）、系统、魔法书。它们是世界观和逻辑链的唯一出口，严禁将其台词转化为旁白，必须以对话形式保留。
2. 【吐槽与氛围类实体】：如萌宠、损友型挂件。它们负责调节情绪流节奏，防止剧本陷入单一阴沉，必须保留其反馈戏份。
3. 【秘密见证者】：唯一知道主角真实身份或前世记忆的非人实体。

改编要求：
- 确保主角与这些实体之间的“推拉”、“吐槽”、“合作”戏份在剧本中占比不低于原著比例。
- 信息传递必须遵循“Show, don't tell”原则，通过主角与辅助实体的交互来展示，而非删除实体。
- 所有环节都必须是中文.

【排版规范（绝对禁止 Markdown）】：
严禁使用 #, *, **, >, -, \` 等任何 Markdown 符号。输出必须是纯净的剧本排版（即：第X集、剧名、正文）。
对齐参考：[${layoutRef || "标准剧本格式"}]

【创作金律】：
1. ${styleInstruction}
2. ${continuityInstruction}
3. 集末卡点：每集结尾必须有勾住观众的“断章”悬念。
4.单集满足500-800字`;

       const response = await ai.models.generateContent({
        model: "google/gemini-3-pro-preview",
        contents: `[上下文]：\n${prevScriptContext}\n[目标]：\n${outline}\n[素材]：\n${novelText}`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              episodes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    episodeNumber: { type: Type.NUMBER },
                    title: { type: Type.STRING },
                    content: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });
      
      const data = JSON.parse(response.text);
      return { episodes: data.episodes || [] };
    });
  }
};
