import React from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Server, Folder, LogOut, Terminal } from 'lucide-react';
import ServiceManager from '../components/ServiceManager';
import FileManager from '../components/FileManager';

export default function Dashboard() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Services', path: '/dashboard', icon: <Server size={20} /> },
    { name: 'Files', path: '/dashboard/files', icon: <Folder size={20} /> },
  ];

  return (
    <div className="min-h-screen flex bg-dark-900">
      {/* Sidebar */}
      <aside className="w-64 glass-panel border-r border-t-0 border-b-0 border-l-0 flex flex-col hidden md:flex z-10 relative rounded-none">
        <div className="p-6 flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-600/20 text-primary-500 rounded-lg flex items-center justify-center border border-primary-500/30">
            <Terminal size={24} />
          </div>
          <span className="text-xl font-bold text-white">NodePanel</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30 shadow-inner' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center justify-between px-4 py-3 bg-dark-900/50 rounded-lg border border-white/5 mb-4">
             <div className="flex flex-col">
               <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Logged in as</span>
               <span className="text-sm text-white font-medium">{user?.username}</span>
             </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex w-full items-center justify-center space-x-2 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors border border-transparent hover:border-red-400/20"
          >
            <LogOut size={18} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/5 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="flex-1 overflow-auto p-8 relative z-10">
          <Routes>
            <Route path="/" element={<ServiceManager />} />
            <Route path="/files" element={<FileManager />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
