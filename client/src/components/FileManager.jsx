import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import { Folder, FileCode, ChevronLeft, Save, X } from 'lucide-react';

export default function FileManager() {
  const [currentPath, setCurrentPath] = useState('');
  const [parentPath, setParentPath] = useState('');
  const [baseDir, setBaseDir] = useState('');
  const [files, setFiles] = useState([]);

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchFiles = async (path = '') => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5082/api/files/list?path=${encodeURIComponent(path)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentPath(res.data.currentPath);
      setParentPath(res.data.parentPath);
      setBaseDir(res.data.baseDir);
      setFiles(res.data.files);
    } catch (err) {
      console.error(err);
      alert('Gagal mengambil daftar file');
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileClick = async (file) => {
    if (file.isDirectory) {
      fetchFiles(file.path);
    } else {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5082/api/files/read?path=${encodeURIComponent(file.path)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSelectedFile(file);
        setFileContent(res.data.content);
        setIsEditing(true);
      } catch (err) {
        alert('Gagal membaca file. Mungkin file binary atau tidak ada akses.');
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5082/api/files/write', {
        path: selectedFile.path,
        content: fileContent
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('File berhasil disimpan!');
    } catch (err) {
      alert('Gagal menyimpan file');
    } finally {
      setSaving(false);
    }
  };

  const getLanguage = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const map = { js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript', json: 'json', html: 'html', css: 'css', md: 'markdown' };
    return map[ext] || 'plaintext';
  };

  return (
    <div className="h-full flex flex-col">
      {!isEditing ? (
        <>
          <div className="flex items-center mb-6">
            <h2 className="text-2xl font-bold text-white mr-4">File Manager</h2>
            <div className="flex-1 bg-dark-900/50 border border-white/10 rounded-lg px-4 py-2 flex items-center">
              <span className="text-slate-400 text-sm overflow-hidden text-ellipsis whitespace-nowrap">{currentPath}</span>
            </div>
          </div>

          <div className="glass-panel rounded-xl flex-1 overflow-hidden flex flex-col">
            <div className="p-2 border-b border-white/10 bg-white/5 h-12 flex items-center">
              {currentPath !== baseDir && (
                <button
                  onClick={() => fetchFiles(parentPath)}
                  className="flex items-center text-sm text-slate-300 hover:text-white px-3 py-1.5 rounded hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft size={16} className="mr-1" /> Back
                </button>
              )}
            </div>
            <div className="flex-1 overflow-auto p-2">
              {files.map((file, idx) => (
                <div
                  key={idx}
                  onClick={() => handleFileClick(file)}
                  className="flex items-center px-4 py-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors group"
                >
                  {file.isDirectory ? (
                    <Folder size={20} className="text-primary-400 mr-3 group-hover:text-primary-300" />
                  ) : (
                    <FileCode size={20} className="text-slate-400 mr-3 group-hover:text-slate-300" />
                  )}
                  <span className="text-slate-200 group-hover:text-white">{file.name}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <button onClick={() => setIsEditing(false)} className="mr-4 text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
              <div>
                <h2 className="text-xl font-bold text-white">{selectedFile.name}</h2>
                <p className="text-xs text-slate-500">{selectedFile.path}</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-primary-500/20 disabled:opacity-50"
            >
              <Save size={18} className="mr-2" /> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>

          <div className="flex-1 rounded-xl overflow-hidden border border-white/10 bg-[#1e1e1e]">
            <Editor
              height="100%"
              theme="vs-dark"
              language={getLanguage(selectedFile.name)}
              value={fileContent}
              onChange={(val) => setFileContent(val)}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                padding: { top: 16 }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
