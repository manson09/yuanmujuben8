
import React, { useState } from 'react';
import { Project, ProjectFile, Category } from '../types';

interface Props {
  project: Project;
  onUpdate: (project: Project) => void;
  onNext: () => void;
  onBack: () => void;
}

const KnowledgeBase: React.FC<Props> = ({ project, onUpdate, onBack, onNext }) => {
  const [activeCategory, setActiveCategory] = useState<Category>('原著小说');
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = (files: FileList) => {
    const newFiles: ProjectFile[] = [];
    const readers: Promise<void>[] = [];

    Array.from(files).forEach(f => {
      const readerPromise = new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          newFiles.push({
            id: Math.random().toString(36).substr(2, 9),
            name: f.name,
            category: activeCategory,
            size: (f.size / 1024).toFixed(1) + 'KB',
            content: text || "非文本内容（如表格或二进制格式），已记录元数据。"
          });
          resolve();
        };
        // Simple extraction: read as text. In real app, we'd use Mammoth for .docx
        if (f.type.includes("text") || f.name.endsWith(".txt") || f.name.endsWith(".md")) {
          reader.readAsText(f);
        } else {
          // Placeholder for non-text formats
          newFiles.push({
            id: Math.random().toString(36).substr(2, 9),
            name: f.name,
            category: activeCategory,
            size: (f.size / 1024).toFixed(1) + 'KB',
            content: `[提取失败: ${f.name}] 此环境仅演示文本提取。实际应用将使用专业解析引擎处理此类格式。`
          });
          resolve();
        }
      });
      readers.push(readerPromise);
    });

    Promise.all(readers).then(() => {
      onUpdate({ ...project, files: [...project.files, ...newFiles] });
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    onUpdate({ ...project, files: project.files.filter(f => f.id !== id) });
  };

  const categories: Category[] = ['原著小说', '排版参考', '文笔参考'];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center bg-gray-800/50 p-4 rounded-2xl border border-gray-700/50">
        <button onClick={onBack} className="flex items-center text-gray-400 hover:text-white transition group">
          <div className="bg-gray-700 p-2 rounded-lg mr-3 group-hover:bg-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </div>
          <span className="font-medium">返回作品管理</span>
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-bold">阶段一：构建作品知识库</h2>
          <div className="flex space-x-1 mt-1">
            <div className="w-8 h-1 bg-blue-500 rounded-full"></div>
            <div className="w-8 h-1 bg-gray-700 rounded-full"></div>
            <div className="w-8 h-1 bg-gray-700 rounded-full"></div>
          </div>
        </div>
        <button 
          onClick={onNext}
          disabled={!project.files.some(f => f.category === '原著小说')}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:grayscale rounded-xl font-bold transition flex items-center space-x-2"
        >
          <span>进入下一步</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest px-2">资料分类</p>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`w-full text-left px-4 py-4 rounded-2xl transition flex items-center justify-between border ${
                activeCategory === cat ? 'bg-blue-600/10 text-blue-400 border-blue-500/50' : 'bg-gray-800 border-transparent hover:bg-gray-700'
              }`}
            >
              <span>{cat}</span>
              <span className="bg-gray-900/50 px-2 py-0.5 rounded-lg text-xs">
                {project.files.filter(f => f.category === cat).length}
              </span>
            </button>
          ))}
          
          <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-2xl mt-8">
            <h4 className="text-blue-400 font-bold text-sm mb-2">💡 专家提示</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              上传多个“文笔参考”和“排版参考”可以帮助AI更精准地模仿您喜欢的风格。系统会优先识别标记为“原著小说”的文件进行核心剧情分析。
            </p>
          </div>
        </div>

        <div className="md:col-span-3">
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`relative glass-morphism p-8 rounded-3xl min-h-[500px] border-2 border-dashed transition-all ${
              isDragging ? 'border-blue-500 bg-blue-500/5 scale-[0.99]' : 'border-gray-700 bg-white/5'
            }`}
          >
            <div className="mb-8">
              <label className="flex flex-col items-center justify-center w-full h-40 rounded-2xl cursor-pointer hover:bg-white/5 transition group">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-blue-600/10 text-blue-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  </div>
                  <p className="text-lg font-bold">批量拖拽上传至 <span className="text-blue-400">{activeCategory}</span></p>
                  <p className="text-sm text-gray-500 mt-1">支持 docx, doc, txt, excel 等多种格式</p>
                </div>
                <input type="file" className="hidden" multiple onChange={handleFileUpload} />
              </label>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-700 pb-2">
                <h3 className="font-bold text-gray-400 uppercase text-xs tracking-wider">当前分类文件列表</h3>
              </div>
              
              {project.files.filter(f => f.category === activeCategory).length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center opacity-30">
                  <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                  <p className="text-sm">暂无上传内容</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {project.files.filter(f => f.category === activeCategory).map(file => (
                    <div key={file.id} className="group flex items-center justify-between bg-gray-800/40 p-4 rounded-2xl border border-gray-700/50 hover:border-blue-500/30 transition shadow-sm">
                      <div className="flex items-center space-x-4 min-w-0">
                        <div className="bg-blue-600/10 p-2 rounded-xl text-blue-400">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" /></svg>
                        </div>
                        <div className="truncate">
                          <div className="text-sm font-bold truncate pr-2">{file.name}</div>
                          <div className="text-[10px] text-gray-500">{file.size}</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeFile(file.id)} 
                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
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

export default KnowledgeBase;
