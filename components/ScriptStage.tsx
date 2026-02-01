
import React, { useState } from 'react';
import { Project, PhasePlan, Mode, ScriptStyle } from '../types';
import { geminiService } from '../services/geminiService';

interface Props {
  project: Project;
  onUpdate: (project: Project) => void;
  onBack: () => void;
}

const ScriptStage: React.FC<Props> = ({ project, onUpdate, onBack }) => {
  const [loading, setLoading] = useState<number | null>(null);
  const [localMode, setLocalMode] = useState<Mode>(project.mode);
  const [localStyle, setLocalStyle] = useState<ScriptStyle>(project.scriptStyle || '情绪流');
  
  const [selectedNovelId, setSelectedNovelId] = useState<string>(project.files.find(f => f.category === '原著小说')?.id || '');
  const [selectedLayoutId, setSelectedLayoutId] = useState<string>(project.files.find(f => f.category === '排版参考')?.id || '');
  const [selectedStyleId, setSelectedStyleId] = useState<string>(project.files.find(f => f.category === '文笔参考')?.id || '');

  const novelFiles = project.files.filter(f => f.category === '原著小说');
  const layoutFiles = project.files.filter(f => f.category === '排版参考');
  const styleFiles = project.files.filter(f => f.category === '文笔参考');

  const generatePhase = async (phase: PhasePlan) => {
    const novel = novelFiles.find(f => f.id === selectedNovelId);
    if (!novel) return alert("请先在左侧选择指定原著小说文件");

    setLoading(phase.phaseIndex);
    try {
      // 1. 先计算本阶段起始集数
      const startEpNum = (project.outline?.phasePlans
        .filter(p => p.phaseIndex < phase.phaseIndex)
        .reduce((sum, p) => sum + p.episodes, 0) || 0) + 1;

      // 2. 提取真正的前置上下文（仅包含集数小于起始集数的剧集）
      // 这样在重新生成阶段 2 时，不会把坏掉的阶段 2 脚本传进去
      let prevContext = "";
      const previousEpisodes = project.scripts
        .flatMap(s => s.episodes)
        .filter(e => e.episodeNumber < startEpNum)
        .sort((a, b) => a.episodeNumber - b.episodeNumber);
      
      if (previousEpisodes.length > 0) {
        // 取最后 3 集作为上下文，深度足够 AI 找回状态
        const lastEps = previousEpisodes.slice(-3);
        prevContext = lastEps.map(e => `第${e.episodeNumber}集(${e.title}): ${e.content}`).join('\n\n');
      }

      const layoutRef = layoutFiles.find(f => f.id === selectedLayoutId)?.content || "";
      const styleRef = styleFiles.find(f => f.id === selectedStyleId)?.content || "";

      const result = await geminiService.generatePhaseScript(
        novel.content,
        project.outline?.content || "",
        phase,
        prevContext,
        localMode,
        localStyle,
        layoutRef,
        styleRef
      );

      const correctedEpisodes = result.episodes.map((ep: any, i: number) => ({
        ...ep,
        episodeNumber: startEpNum + i
      }));

      const updatedScripts = [...project.scripts.filter(s => s.phaseIndex !== phase.phaseIndex)];
      updatedScripts.push({
        phaseIndex: phase.phaseIndex,
        episodes: correctedEpisodes,
        generatedAt: Date.now(),
        style: localStyle
      });

      onUpdate({ ...project, scripts: updatedScripts, mode: localMode, scriptStyle: localStyle });
    } catch (error) {
      console.error(error);
      alert(`创作阶段 ${phase.phaseIndex} 脚本失败，请重试。`);
    } finally {
      setLoading(null);
    }
  };

  const downloadAsDocx = (phaseIndex: number) => {
    const script = project.scripts.find(s => s.phaseIndex === phaseIndex);
    if (!script) return;
    const title = `${project.name}_第${phaseIndex}阶段脚本.docx`;
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><style>body{font-family: 'SimSun', serif; padding: 40px;} .episode{margin-bottom: 60px; padding-bottom: 20px;} .ep-title{font-weight: bold; font-size: 16pt; color: #1a56db; margin-bottom: 15px;} .content{font-size: 11pt; line-height: 1.8; color: #333; white-space: pre-wrap;}</style></head><body>`;
    let body = `<h1>${project.name} - 阶段 ${phaseIndex} (${script.style})</h1>`;
    script.episodes.forEach(ep => { body += `<div class="episode"><div class="ep-title">第 ${ep.episodeNumber} 集：${ep.title}</div><div class="content">${ep.content}</div></div>`; });
    const blob = new Blob([header + body + "</body></html>"], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = title; link.click();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-32">
      <div className="flex justify-between items-center bg-gray-800/80 p-5 rounded-3xl border border-gray-700 shadow-2xl backdrop-blur-xl">
        <button onClick={onBack} className="flex items-center text-gray-400 hover:text-white transition group px-4 py-2 hover:bg-white/5 rounded-2xl">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          <span className="font-bold">返回</span>
        </button>
        
        <div className="flex flex-col items-center">
          <div className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-1">Golden Rhythm Engine v3.0</div>
          <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400">黄金节奏剧本工厂</h2>
        </div>

        <div className="flex bg-gray-900/80 rounded-2xl p-1 border border-gray-700">
           <button onClick={() => setLocalMode('男频')} className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${localMode === '男频' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>男频</button>
           <button onClick={() => setLocalMode('女频')} className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${localMode === '女频' ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>女频</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-morphism p-6 rounded-[32px] border border-white/5 space-y-6">
            <h3 className="font-black text-sm text-gray-400 flex items-center space-x-2">
              <span className="w-1.5 h-4 bg-amber-500 rounded-full"></span>
              <span>剧本风格偏好</span>
            </h3>
            
            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => setLocalStyle('情绪流')}
                className={`p-4 rounded-2xl border text-left transition-all ${localStyle === '情绪流' ? 'bg-red-600/10 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-gray-900 border-gray-800'}`}
              >
                <div className={`font-black text-sm ${localStyle === '情绪流' ? 'text-red-400' : 'text-gray-400'}`}>情绪流 (极致冲突)</div>
                <div className="text-[10px] text-gray-500 mt-1">节奏极快、反派脑残化、情绪拉满、爽点爆发。</div>
              </button>
              <button 
                onClick={() => setLocalStyle('非情绪流')}
                className={`p-4 rounded-2xl border text-left transition-all ${localStyle === '非情绪流' ? 'bg-purple-600/10 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'bg-gray-900 border-gray-800'}`}
              >
                <div className={`font-black text-sm ${localStyle === '非情绪流' ? 'text-purple-400' : 'text-gray-400'}`}>非情绪流 (诙谐幽默)</div>
                <div className="text-[10px] text-gray-500 mt-1">诙谐逗趣、反套路脑洞、融合热梗、节奏依然拉满。</div>
              </button>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-800">
              <div>
                <label className="block text-[10px] text-gray-500 mb-1.5 font-black uppercase tracking-widest">指定原著</label>
                <select value={selectedNovelId} onChange={e => setSelectedNovelId(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-xs text-blue-400 font-bold outline-none">
                  {novelFiles.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-1.5 font-black uppercase tracking-widest">排版参考</label>
                <select value={selectedLayoutId} onChange={e => setSelectedLayoutId(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-xs text-amber-500 font-bold outline-none">
                  <option value="">(默认标准)</option>
                  {layoutFiles.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
             {project.outline?.phasePlans.map((plan) => {
               const script = project.scripts.find(s => s.phaseIndex === plan.phaseIndex);
               const isGenerated = !!script;
               const prevGenerated = plan.phaseIndex === 1 || project.scripts.some(s => s.phaseIndex === plan.phaseIndex - 1);

               return (
                 <div key={plan.phaseIndex} className={`group p-6 rounded-[32px] border transition-all duration-700 ${isGenerated ? 'bg-blue-600/5 border-blue-500/30 shadow-lg' : 'bg-gray-800/40 border-gray-700 opacity-60'}`}>
                   <div className="flex justify-between items-start mb-4">
                     <span className={`text-xs font-black px-2 py-0.5 rounded ${isGenerated ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}>阶段 {plan.phaseIndex}</span>
                     <span className="text-[10px] font-black text-gray-500">{plan.episodes}集</span>
                   </div>
                   <div className="flex space-x-2">
                     <button 
                        onClick={() => generatePhase(plan)}
                        disabled={loading !== null || (!prevGenerated && !isGenerated)}
                        className={`flex-1 text-[11px] py-3 rounded-2xl font-black transition-all ${
                          loading === plan.phaseIndex ? 'bg-amber-500 text-white animate-pulse' : 
                          isGenerated ? 'bg-gray-700/80 text-gray-300' : 
                          (prevGenerated ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-500/20' : 'bg-gray-800 text-gray-600 cursor-not-allowed')
                        }`}
                     >
                       {loading === plan.phaseIndex ? '创作中...' : isGenerated ? '重新生成' : '批量创作'}
                     </button>
                     {isGenerated && (
                       <button onClick={() => downloadAsDocx(plan.phaseIndex)} className="px-4 bg-gray-900 rounded-2xl border border-gray-700 text-blue-400 transition-all">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                       </button>
                     )}
                   </div>
                 </div>
               );
             })}
          </div>
        </div>

        <div className="lg:col-span-9">
          <div className="glass-morphism rounded-[40px] min-h-[85vh] flex flex-col border border-white/5 shadow-2xl overflow-hidden">
            <div className="bg-gray-900/60 px-10 py-5 border-b border-gray-800/50 flex justify-between items-center backdrop-blur-md">
               <div className="flex items-center space-x-4">
                 <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse shadow-lg shadow-amber-500/50"></div>
                 <span className="text-xs font-black text-gray-400 uppercase tracking-widest">脚本预览 / 期待感校验</span>
               </div>
               <div className="text-[10px] font-black text-gray-600 bg-gray-800 px-3 py-1 rounded-full border border-gray-700">集集有钩子 • 秒秒带爽点</div>
            </div>

            <div className="flex-1 p-12 overflow-y-auto custom-scrollbar max-h-[82vh] bg-gray-950/20">
              {project.scripts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-8 py-20 text-center">
                   <div className="w-40 h-40 bg-gray-800/20 rounded-full flex items-center justify-center border-4 border-dashed border-gray-700/30">
                     <svg className="w-20 h-20 opacity-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                   </div>
                   <div className="max-w-md">
                     <p className="text-2xl font-black text-gray-400 tracking-tighter">等待创作第一阶段脚本</p>
                     <p className="text-sm mt-4 text-gray-500 leading-relaxed font-medium">请选择左侧风格后点击“批量创作”。AI将根据您选择的风格（情绪流/非情绪流）对原著进行深度漫剧化改编。</p>
                   </div>
                </div>
              ) : (
                <div className="space-y-32">
                  {[...project.scripts].sort((a, b) => a.phaseIndex - b.phaseIndex).map(phaseScript => (
                    <section key={phaseScript.phaseIndex} className="animate-fadeIn">
                      <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-md py-6 mb-12 flex items-center justify-between border-b-2 border-amber-500/30">
                         <div className="flex items-center space-x-8">
                           <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl flex items-center justify-center text-white font-black text-2xl shadow-lg border border-white/20">
                             {phaseScript.phaseIndex}
                           </div>
                           <div>
                             <h3 className="text-3xl font-black text-white tracking-tighter">阶段 {phaseScript.phaseIndex}：{phaseScript.style}</h3>
                             <div className="flex items-center space-x-3 mt-1.5">
                               <span className="text-[10px] text-amber-400 font-black uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded">极致节奏已生效</span>
                             </div>
                           </div>
                         </div>
                      </div>
                      <div className="space-y-24">
                        {phaseScript.episodes.map(ep => (
                          <div key={ep.episodeNumber} className="relative group pl-12">
                             <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500/50 via-purple-500/50 to-transparent rounded-full"></div>
                             <div className="flex items-center space-x-5 mb-8">
                               <div className="bg-amber-600 text-white w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black">#{ep.episodeNumber}</div>
                               <h4 className="text-2xl font-black text-gray-100">{ep.title}</h4>
                             </div>
                             <div className="bg-gray-800/40 p-10 rounded-[48px] border border-white/5 text-lg text-gray-200 leading-[2.2] font-serif whitespace-pre-wrap shadow-2xl backdrop-blur-sm">
                               {ep.content}
                             </div>
                             <div className="mt-8 flex items-center justify-end px-6">
                               <div className="text-[11px] font-black text-gray-600 tracking-[0.2em] uppercase opacity-40">卡点 & 钩子已埋设 • 第 {ep.episodeNumber} 集完</div>
                             </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptStage;
