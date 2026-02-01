
import React, { useState, useEffect, useRef } from 'react';
import { Project, ViewState } from './types';
import { storage } from './services/storage';
import KnowledgeBase from './components/KnowledgeBase';
import OutlineStage from './components/OutlineStage';
import ScriptStage from './components/ScriptStage';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>('MANAGEMENT');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setProjects(storage.getProjects()); }, []);
  useEffect(() => { if (showCreateModal && inputRef.current) inputRef.current.focus(); }, [showCreateModal]);

  const currentProject = projects.find(p => p.id === currentProjectId);

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name: newProjectName.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      files: [],
      mode: '男频',
      scriptStyle: '情绪流', // 默认设定为情绪流
      scripts: []
    };
    const updated = [newProject, ...projects];
    setProjects(updated);
    storage.saveProjects(updated);
    setCurrentProjectId(newProject.id);
    setView('KNOWLEDGE_BASE');
    setNewProjectName('');
    setShowCreateModal(false);
  };

  const updateProject = (p: Project) => {
    const updated = projects.map(proj => proj.id === p.id ? p : proj);
    setProjects(updated);
    storage.saveProjects(updated);
  };

  const deleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("确定要删除该作品吗？")) return;
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    storage.saveProjects(updated);
  };

  if (view === 'MANAGEMENT') {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              AI 漫剧智能创作中心
            </h1>
            <p className="text-gray-400 mt-2 font-medium">专业级动漫爽剧全链路创作智能体</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            <span>创建新作品</span>
          </button>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.length === 0 ? (
            <div className="col-span-full py-32 text-center glass-morphism rounded-3xl border-dashed border-2 border-gray-700">
              <p className="text-gray-400 text-lg">开启您的漫剧创作之旅</p>
              <button onClick={() => setShowCreateModal(true)} className="mt-4 text-blue-500 hover:text-blue-400 font-bold">点击此处创建第一个作品</button>
            </div>
          ) : (
            projects.map(p => (
              <div key={p.id} onClick={() => { setCurrentProjectId(p.id); setView('KNOWLEDGE_BASE'); }} className="group relative glass-morphism p-6 rounded-2xl hover:bg-white/10 transition-all cursor-pointer border border-transparent hover:border-blue-500/50 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </div>
                  <button onClick={(e) => deleteProject(p.id, e)} className="text-gray-600 hover:text-red-400 transition-colors p-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
                <h3 className="text-xl font-bold mb-1 truncate">{p.name}</h3>
                <p className="text-xs text-gray-500 mb-6 italic">最后编辑: {new Date(p.updatedAt).toLocaleString()}</p>
                <div className="flex space-x-4 text-xs">
                  <span className="bg-gray-800 px-2 py-0.5 rounded text-gray-400">{p.files.length} 素材</span>
                  <span className={`px-2 py-0.5 rounded ${p.scriptStyle === '情绪流' ? 'bg-red-900/30 text-red-400' : 'bg-purple-900/30 text-purple-400'}`}>{p.scriptStyle}</span>
                </div>
              </div>
            ))
          )}
        </div>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fadeIn">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}></div>
            <div className="relative bg-gray-900 border border-gray-700 w-full max-w-md p-8 rounded-3xl shadow-2xl animate-scaleIn">
              <h3 className="text-2xl font-bold mb-6">创建新作品</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">作品名称</label>
                  <input ref={inputRef} type="text" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
                <div className="flex space-x-4">
                  <button onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-3 border border-gray-700 rounded-xl hover:bg-gray-800 font-bold transition">取消</button>
                  <button onClick={handleCreateProject} disabled={!newProjectName.trim()} className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition">确认创建</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="border-b border-gray-800 bg-gray-900/50 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-16">
          <button onClick={() => setView('MANAGEMENT')} className="flex items-center text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            <span className="font-bold text-blue-400">{currentProject?.name}</span>
          </button>
          <div className="flex space-x-2 bg-gray-800/50 p-1 rounded-xl">
            <button onClick={() => setView('KNOWLEDGE_BASE')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${view === 'KNOWLEDGE_BASE' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>1. 素材库</button>
            <button onClick={() => setView('OUTLINE')} disabled={!currentProject?.files.length} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${view === 'OUTLINE' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300 disabled:opacity-20'}`}>2. 剧本大纲</button>
            <button onClick={() => setView('SCRIPT')} disabled={!currentProject?.outline} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${view === 'SCRIPT' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300 disabled:opacity-20'}`}>3. 剧情脚本</button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {currentProject && (
          <>
            {view === 'KNOWLEDGE_BASE' && <KnowledgeBase project={currentProject} onUpdate={updateProject} onNext={() => setView('OUTLINE')} onBack={() => setView('MANAGEMENT')} />}
            {view === 'OUTLINE' && <OutlineStage project={currentProject} onUpdate={updateProject} onBack={() => setView('KNOWLEDGE_BASE')} />}
            {view === 'SCRIPT' && <ScriptStage project={currentProject} onUpdate={updateProject} onBack={() => setView('OUTLINE')} />}
          </>
        )}
      </main>
    </div>
  );
};

export default App;
