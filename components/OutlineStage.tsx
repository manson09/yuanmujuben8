
import React, { useState } from 'react';
import { Project, Mode } from '../types';
import { geminiService } from '../services/geminiService';

interface Props {
  project: Project;
  onUpdate: (project: Project) => void;
  onBack: () => void;
}

const OutlineStage: React.FC<Props> = ({ project, onUpdate, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [selectedNovelId, setSelectedNovelId] = useState<string>(project.files.find(f => f.category === '原著小说')?.id || '');
  const [mode, setMode] = useState<Mode>(project.mode);

  const novelFiles = project.files.filter(f => f.category === '原著小说');

  const generate = async () => {
    const novel = novelFiles.find(f => f.id === selectedNovelId);
    if (!novel) return alert("请先在知识库中上传并选择原著小说素材");

    setLoading(true);
    try {
      const result = await geminiService.generateOutline(novel.content, mode);
      onUpdate({ ...project, outline: result, mode });
    } catch (error) {
      console.error(error);
      alert("AI 生成失败。这可能是由于内容过长或 API 连接问题。请稍后再试。");
    } finally {
      setLoading(false);
    }
  };

  const downloadText = () => {
    if (!project.outline) return;
    const content = `作品名：${project.name}\n创作模式：${project.mode}\n\n【剧本故事大纲】\n${project.outline.content}\n\n【人物小传】\n${project.outline.characters.map(c => `姓名：${c.name}，性别：${c.gender}，年龄：${c.age}，身份：${c.identity}，外表：${c.appearance}，成长经历：${c.growth}，动机：${c.motivation}`).join('\n\n')}\n\n【阶段规划路线图】\n${project.outline.phasePlans.map(p => `阶段 ${p.phaseIndex} (共${p.episodes}集): ${p.description}\n高潮点：${p.climax}`).join('\n\n')}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name}_深度故事大纲.txt`;
    link.click();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24">
      <div className="flex justify-between items-center bg-gray-800/50 p-4 rounded-2xl border border-gray-700/50">
        <button onClick={onBack} className="flex items-center text-gray-400 hover:text-white transition group">
          <div className="bg-gray-700 p-2 rounded-lg mr-3 group-hover:bg-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </div>
          <span className="font-medium">返回知识库</span>
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-bold">阶段二：故事大纲与阶段规划</h2>
          <div className="flex space-x-1 mt-1">
            <div className="w-8 h-1 bg-blue-500 rounded-full"></div>
            <div className="w-8 h-1 bg-blue-500 rounded-full"></div>
            <div className="w-8 h-1 bg-gray-700 rounded-full"></div>
          </div>
        </div>
        <div className="flex space-x-3">
           {project.outline && (
             <button 
               onClick={downloadText} 
               className="px-4 py-2 border border-gray-700 rounded-xl hover:bg-gray-800 transition text-sm font-bold flex items-center space-x-2"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
               <span>下载大纲</span>
             </button>
           )}
           <button 
             onClick={generate}
             disabled={loading}
             className={`px-6 py-2 rounded-xl font-bold transition flex items-center space-x-2 ${loading ? 'bg-gray-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20'}`}
           >
             {loading ? (
               <>
                 <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 <span>AI 正在脑暴中...</span>
               </>
             ) : (
               <>
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                 <span>{project.outline ? '重新生成全案' : '开始智能创作'}</span>
               </>
             )}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="space-y-6">
          <div className="glass-morphism p-6 rounded-3xl space-y-5">
            <h3 className="font-bold text-lg border-b border-gray-700 pb-2">核心创作参数</h3>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">创作模式</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setMode('男频')}
                  className={`py-2.5 rounded-xl border text-sm font-bold transition flex items-center justify-center space-x-2 ${mode === '男频' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'border-gray-800 text-gray-500 hover:bg-gray-800'}`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 9V5a1 1 0 112 0v4h4a1 1 0 110 2H9v4a1 1 0 11-2 0V11H3a1 1 0 110-2h4z" /></svg>
                  <span>男频</span>
                </button>
                <button 
                  onClick={() => setMode('女频')}
                  className={`py-2.5 rounded-xl border text-sm font-bold transition flex items-center justify-center space-x-2 ${mode === '女频' ? 'bg-pink-600/20 border-pink-500 text-pink-400' : 'border-gray-800 text-gray-500 hover:bg-gray-800'}`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 9V5a1 1 0 112 0v4h4a1 1 0 110 2H9v4a1 1 0 11-2 0V11H3a1 1 0 110-2h4z" /></svg>
                  <span>女频</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">指定原著核心</label>
              <select 
                value={selectedNovelId} 
                onChange={(e) => setSelectedNovelId(e.target.value)}
                className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              >
                {novelFiles.length === 0 ? <option>未检测到小说文件</option> : novelFiles.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          </div>

          {project.outline && (
            <div className="glass-morphism p-6 rounded-3xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">阶段执行路线</h3>
                <span className="text-[10px] bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full">65-80集</span>
              </div>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {project.outline.phasePlans.map((plan, idx) => (
                  <div key={idx} className={`p-4 rounded-2xl border relative overflow-hidden transition ${plan.phaseIndex === 1 ? 'border-amber-500/50 bg-amber-500/5' : 'border-gray-800 bg-gray-900/40'}`}>
                    {plan.phaseIndex === 1 && <div className="absolute top-0 right-0 bg-amber-500 text-[8px] font-black px-2 py-0.5 rounded-bl-lg">核心首战</div>}
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-black text-blue-400 uppercase">Phase {plan.phaseIndex}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-800 rounded-full border border-gray-700">{plan.episodes}集</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed mb-3">{plan.description}</p>
                    <div className="flex items-start space-x-2">
                      <svg className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                      <span className="text-[10px] font-black text-amber-500/80 uppercase">爽点爆点:</span>
                    </div>
                    <div className="text-[11px] text-gray-300 mt-1 pl-5 italic">{plan.climax}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-3 space-y-6">
          {!project.outline ? (
            <div className="glass-morphism h-[700px] rounded-3xl flex flex-col items-center justify-center text-gray-500 space-y-6 text-center px-12">
              <div className="w-24 h-24 bg-gray-800/50 rounded-full flex items-center justify-center border border-gray-700/50">
                <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-300 mb-2">准备就绪，等待创作指令</h4>
                <p className="max-w-md text-sm leading-relaxed">请选择左侧的参数。点击“开始生成”后，AI将通过深度分析原著，为您构建一个极具爽感的动漫脚本蓝图。</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fadeIn">
              <div className="glass-morphism p-8 rounded-3xl shadow-2xl">
                <h3 className="text-2xl font-black mb-6 flex items-center space-x-3">
                  <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
                  <span>深度剧情大纲 (起——承——转——合)</span>
                </h3>
                <div className="prose prose-invert max-w-none text-gray-300 leading-loose text-base whitespace-pre-wrap">
                  {project.outline.content}
                </div>
              </div>

              <div className="glass-morphism p-8 rounded-3xl">
                <h3 className="text-2xl font-black mb-8 flex items-center space-x-3">
                  <span className="w-2 h-8 bg-purple-600 rounded-full"></span>
                  <span>漫剧核心角色库</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {project.outline.characters.map((char, i) => (
                    <div key={i} className="group bg-gray-800/30 p-6 rounded-2xl border border-gray-700/50 hover:border-purple-500/30 transition shadow-inner relative overflow-hidden">
                      <div className="absolute -right-4 -bottom-4 text-purple-600/5 opacity-0 group-hover:opacity-100 transition rotate-12">
                        <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                      </div>
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-xl font-black text-white">{char.name}</h4>
                        <div className="flex space-x-2">
                          <span className="text-[10px] font-bold bg-gray-900 px-2 py-0.5 rounded border border-gray-700">{char.gender}</span>
                          <span className="text-[10px] font-bold bg-gray-900 px-2 py-0.5 rounded border border-gray-700">{char.age}岁</span>
                        </div>
                      </div>
                      <div className="space-y-3 text-xs">
                        <p className="text-gray-400"><span className="text-purple-400 font-bold uppercase tracking-tighter mr-2">身份定位:</span> {char.identity}</p>
                        <p className="text-gray-400"><span className="text-purple-400 font-bold uppercase tracking-tighter mr-2">视觉特征:</span> {char.appearance}</p>
                        <p className="text-gray-400"><span className="text-purple-400 font-bold uppercase tracking-tighter mr-2">核心成长:</span> {char.growth}</p>
                        <div className="pt-2 border-t border-gray-700/50">
                          <p className="text-gray-200 italic font-medium">“{char.motivation}”</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OutlineStage;
