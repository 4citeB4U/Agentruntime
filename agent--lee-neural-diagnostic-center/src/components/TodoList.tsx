import React, { useState } from 'react';
import { ListTodo, CheckCircle2, Circle, Clock, AlertCircle, Plus, Trash2 } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  priority: 'High' | 'Med' | 'Low';
  timestamp: string;
}

const initialTasks: Task[] = [
  { id: '1', title: 'Optimize GLM-4.7-FLASH neural weights', status: 'In Progress', priority: 'High', timestamp: '2026-03-29 06:24' },
  { id: '2', title: 'Synchronize episodic memory clusters', status: 'Pending', priority: 'Med', timestamp: '2026-03-29 06:25' },
  { id: '3', title: 'Audit autonomous agent permissions', status: 'Completed', priority: 'Low', timestamp: '2026-03-29 06:26' },
  { id: '4', title: 'Refactor memory pipeline for Android', status: 'In Progress', priority: 'High', timestamp: '2026-03-29 06:27' },
  { id: '5', title: 'Update diagnostic visualization layers', status: 'Pending', priority: 'Med', timestamp: '2026-03-29 06:28' }
];

export default function TodoList() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [newTask, setNewTask] = useState('');

  const addTask = () => {
    if (!newTask.trim()) return;
    const task: Task = {
      id: Date.now().toString(),
      title: newTask,
      status: 'Pending',
      priority: 'Med',
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
    setTasks([task, ...tasks]);
    setNewTask('');
  };

  const toggleStatus = (id: string) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        const nextStatus: Task['status'] = t.status === 'Pending' ? 'In Progress' : t.status === 'In Progress' ? 'Completed' : 'Pending';
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-full bg-transparent text-[#e0e7ff] font-['Inter'] p-4 max-w-4xl mx-auto">
      <div className="bg-black/40 p-6 md:p-8 rounded-2xl border border-[#1bf7cd33] shadow-[0_0_40px_rgba(27,247,205,0.1)] backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h3 className="text-2xl font-bold text-[#1bf7cd] flex items-center gap-4 uppercase tracking-tighter">
            <ListTodo size={32} /> INTENT CLASSIFIER
          </h3>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              placeholder="Inject new operation..."
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#1bf7cd] transition-all flex-1 md:w-64"
            />
            <button 
              onClick={addTask}
              className="animated-border p-2 bg-[#1bf7cd26] border border-[#1bf7cd4d] text-[#1bf7cd] rounded-lg hover:bg-[#1bf7cd33] transition-all"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {tasks.map((t) => (
            <div 
              key={t.id} 
              className="group p-4 bg-white/5 rounded-xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/10 transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-[#1bf7cd] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <button 
                  onClick={() => toggleStatus(t.id)}
                  className={`transition-colors ${
                    t.status === 'Completed' ? 'text-[#1bf7cd]' : 
                    t.status === 'In Progress' ? 'text-[#f7d31b]' : 'text-gray-600'
                  }`}
                >
                  {t.status === 'Completed' ? <CheckCircle2 size={20} /> : t.status === 'In Progress' ? <Clock size={20} /> : <Circle size={20} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium truncate ${t.status === 'Completed' ? 'line-through text-gray-500' : ''}`}>
                    {t.title}
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono mt-1">{t.timestamp}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-[9px] text-gray-500 uppercase font-bold mb-1">{t.status}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                    t.priority === 'High' ? 'bg-[#ff2a6d26] text-[#ff2a6d]' :
                    t.priority === 'Med' ? 'bg-[#f7d31b26] text-[#f7d31b]' :
                    'bg-[#1bf7cd26] text-[#1bf7cd]'
                  }`}>{t.priority}</span>
                </div>
                <button 
                  onClick={() => deleteTask(t.id)}
                  className="p-2 text-gray-600 hover:text-[#ff2a6d] transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          
          {tasks.length === 0 && (
            <div className="text-center py-12 text-gray-500 font-mono text-sm">
              <AlertCircle className="mx-auto mb-3 opacity-20" size={48} />
              NO ACTIVE OPERATIONS DETECTED
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
