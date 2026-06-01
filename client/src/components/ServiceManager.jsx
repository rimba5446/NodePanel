import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Play, Square, RotateCw, Trash2, Cpu, MemoryStick, Clock, Activity, Terminal, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export default function ServiceManager() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metricsHistory, setMetricsHistory] = useState({});
  const [selectedService, setSelectedService] = useState(null);
  const [activeTab, setActiveTab] = useState('graph');
  const [logs, setLogs] = useState({ out: '', err: '' });
  const logsEndRef = useRef(null);

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5082/api/services', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (Array.isArray(res.data)) {
        setServices(res.data);

        setMetricsHistory(prev => {
          const next = { ...prev };
          res.data.forEach(srv => {
            // MUST copy the array to avoid mutating frozen React state
            const currentHistory = next[srv.id] ? [...next[srv.id]] : [];
            const now = new Date();
            
            currentHistory.push({
              time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`,
              cpu: srv.cpu || 0,
              memory: parseFloat(((srv.memory || 0) / 1024 / 1024).toFixed(1))
            });
            
            if (currentHistory.length > 15) currentHistory.shift();
            
            next[srv.id] = currentHistory;
          });
          return next;
        });
      }
    } catch (err) {
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (processId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5082/api/services/logs/${processId}?_t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(res.data || { out: '', err: '' });
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  };

  useEffect(() => {
    if (selectedService && activeTab === 'console') {
      fetchLogs(selectedService.id);
      const interval = setInterval(() => fetchLogs(selectedService.id), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedService, activeTab]);

  useEffect(() => {
    if (activeTab === 'console') {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, activeTab]);

  const openModal = (service, tab) => {
    setSelectedService(service);
    setActiveTab(tab);
  };

  const closeModal = () => {
    setSelectedService(null);
    setLogs({ out: '', err: '' });
  };

  useEffect(() => {
    fetchServices();
    const interval = setInterval(fetchServices, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (action, processId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5082/api/services/action', { action, processId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchServices();
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed');
    }
  };

  const formatMemory = (bytes) => (bytes / 1024 / 1024).toFixed(1) + ' MB';
  const formatUptime = (timestamp) => {
    if (!timestamp) return '0s';
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${mins}m`;
  };

  if (loading) return <div className="text-white flex justify-center mt-20">Loading services...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Service Manager</h2>

      <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
        {services.length === 0 ? (
          <div className="col-span-full p-8 border border-dashed border-white/20 rounded-xl text-center text-slate-400">
            No Node.js services running in PM2.
          </div>
        ) : (
          services.map(service => (
            <div key={service.id} className="glass-panel p-6 rounded-xl flex flex-col hover:border-primary-500/30 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center">
                    {service.name}
                    <span className={`ml-3 px-2 py-0.5 rounded text-xs font-bold ${service.status === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {(service.status || 'unknown').toUpperCase()}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">ID: {service.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 mt-auto">
                <div className="flex items-center text-sm text-slate-300">
                  <MemoryStick size={16} className="text-slate-500 mr-2" />
                  {formatMemory(service.memory)}
                </div>
                <div className="flex items-center text-sm text-slate-300">
                  <Cpu size={16} className="text-slate-500 mr-2" />
                  {service.cpu}%
                </div>
                <div className="flex items-center text-sm text-slate-300 col-span-2">
                  <Clock size={16} className="text-slate-500 mr-2" />
                  Uptime: {formatUptime(service.uptime)}
                </div>
              </div>

              <div className="flex space-x-2 mt-auto border-t border-white/10 pt-4">
                <button onClick={() => openModal(service, 'graph')} className="glass-button px-3 py-2 rounded-lg flex items-center justify-center text-blue-400 hover:text-blue-300 hover:border-blue-400/30" title="Graph">
                  <Activity size={16} />
                </button>
                <button onClick={() => openModal(service, 'console')} className="glass-button px-3 py-2 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-300 hover:border-slate-400/30" title="Console">
                  <Terminal size={16} />
                </button>
                <div className="flex-1"></div>
                {service.status === 'online' ? (
                  <button onClick={() => handleAction('stop', service.id)} className="glass-button px-3 py-2 rounded-lg flex items-center justify-center text-amber-400 hover:text-amber-300 hover:border-amber-400/30" title="Stop">
                    <Square size={16} />
                  </button>
                ) : (
                  <button onClick={() => handleAction('start', service.id)} className="glass-button px-3 py-2 rounded-lg flex items-center justify-center text-green-400 hover:text-green-300 hover:border-green-400/30" title="Start">
                    <Play size={16} />
                  </button>
                )}
                <button onClick={() => handleAction('restart', service.id)} className="glass-button px-3 py-2 rounded-lg flex items-center justify-center text-primary-400 hover:text-primary-300 hover:border-primary-400/30" title="Restart">
                  <RotateCw size={16} />
                </button>
                <button onClick={() => handleAction('delete', service.id)} className="glass-button px-3 py-2 rounded-lg flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-400/10 border-transparent hover:border-red-400/20" title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center">
                {selectedService.name} - {activeTab === 'graph' ? 'Performance' : 'Console Logs'}
              </h3>
              <div className="flex items-center space-x-2">
                <div className="flex bg-slate-800 rounded-lg p-1">
                  <button 
                    onClick={() => setActiveTab('graph')}
                    className={`px-3 py-1.5 rounded-md text-sm flex items-center transition-colors ${activeTab === 'graph' ? 'bg-primary-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                  >
                    <Activity size={14} className="mr-1.5" /> Graph
                  </button>
                  <button 
                    onClick={() => setActiveTab('console')}
                    className={`px-3 py-1.5 rounded-md text-sm flex items-center transition-colors ${activeTab === 'console' ? 'bg-primary-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                  >
                    <Terminal size={14} className="mr-1.5" /> Console
                  </button>
                </div>
                <button onClick={closeModal} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg ml-2 transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 p-4 overflow-hidden flex flex-col">
              {activeTab === 'graph' ? (
                <div className="flex flex-col h-[60vh] gap-6">
                  <div className="flex-1 min-h-[200px] bg-slate-800/50 p-4 rounded-xl border border-white/5 flex flex-col">
                    <h4 className="text-slate-400 mb-4 text-sm font-semibold flex items-center">
                      <MemoryStick size={14} className="mr-2" /> Memory Usage (MB)
                    </h4>
                    <div className="flex-1 w-full h-full min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={metricsHistory[selectedService.id] || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickMargin={10} />
                          <YAxis stroke="#94a3b8" fontSize={12} tickMargin={10} />
                          <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '0.5rem' }} />
                          <Line type="monotone" dataKey="memory" stroke="#8b5cf6" strokeWidth={3} dot={false} isAnimationActive={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="flex-1 min-h-[200px] bg-slate-800/50 p-4 rounded-xl border border-white/5 flex flex-col">
                    <h4 className="text-slate-400 mb-4 text-sm font-semibold flex items-center">
                      <Cpu size={14} className="mr-2" /> CPU Usage (%)
                    </h4>
                    <div className="flex-1 w-full h-full min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={metricsHistory[selectedService.id] || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickMargin={10} />
                          <YAxis stroke="#94a3b8" fontSize={12} tickMargin={10} />
                          <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '0.5rem' }} />
                          <Line type="monotone" dataKey="cpu" stroke="#10b981" strokeWidth={3} dot={false} isAnimationActive={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 bg-[#0f172a] rounded-xl border border-slate-700 font-mono text-sm overflow-hidden flex flex-col h-[60vh]">
                  <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex space-x-6 text-xs">
                    <span className="text-emerald-400 font-semibold flex items-center">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 mr-2"></div> STDOUT
                    </span>
                    <span className="text-rose-400 font-semibold flex items-center">
                      <div className="w-2 h-2 rounded-full bg-rose-400 mr-2"></div> STDERR
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#0a0f1c]">
                    {logs.out && (
                      <div className="text-slate-300 whitespace-pre-wrap break-all">
                        {logs.out}
                      </div>
                    )}
                    {logs.err && (
                      <div className="text-rose-300 whitespace-pre-wrap break-all mt-4 border-t border-rose-900/30 pt-4">
                        {logs.err}
                      </div>
                    )}
                    {!logs.out && !logs.err && (
                      <div className="text-slate-500 italic flex items-center justify-center h-full">
                        No logs available for this service...
                      </div>
                    )}
                    <div ref={logsEndRef} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
