import React, { useState, useEffect, ReactNode, useRef } from 'react';
import { 
  Users, 
  Briefcase, 
  CheckSquare, 
  FileText, 
  Package, 
  LayoutDashboard,
  Search,
  Plus,
  Activity,
  AlertCircle,
  Pencil,
  Trash2,
  Bell,
  CheckCircle2,
  Filter,
  BarChart3,
  Calendar,
  User as UserIcon,
  Download,
  X,
  Upload,
  LogOut,
  Lock,
  Mail,
  ShieldCheck,
  ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Utils ---
const api = {
  get: (url: string) => fetch(url, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  }).then(r => {
    console.log('GET', url, '→', r.status);
    return r.json();
  }).catch(e => {
    console.error('GET error:', url, e);
    throw e;
  }),

  post: (url: string, data: any) => fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(data),
  }).then(r => {
    console.log('POST', url, '→', r.status);
    return r.json();
  }).catch(e => {
    console.error('POST error:', url, e);
    throw e;
  }),

  put: (url: string, data: any) => fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(data),
  }).then(r => {
    console.log('PUT', url, '→', r.status);
    return r.json();
  }).catch(e => {
    console.error('PUT error:', url, e);
    throw e;
  }),

  delete: (url: string) => fetch(url, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  }).then(r => {
    console.log('DELETE', url, '→', r.status);
    return r.json().catch(() => ({ ok: r.ok }));
  }).catch(e => {
    console.error('DELETE error:', url, e);
    throw e;
  }),

  upload: (url: string, file: File, fieldName: string) => {
    const formData = new FormData();
    formData.append(fieldName, file);
    return fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: formData
    }).then(r => {
      console.log('UPLOAD', url, '→', r.status);
      return r.json();
    }).catch(e => {
      console.error('UPLOAD error:', url, e);
      throw e;
    });
  }
};

// --- Types ---

/**
 * View types for the main navigation
 * Each view corresponds to a major section of the application
 */
type View = 'dashboard' | 'electricians' | 'jobs' | 'tasks' | 'reports' | 'materials';

interface Electrician {
  id: string;
  name: string;
  level: string;
  status: string;
  availability: string;
}

interface Job {
  id: string;
  title: string;
  location: string;
  status: string;
  assignedTo: string;
  deadline?: string;
}

interface Task {
  id: string;
  jobId: string;
  description: string;
  priority: string;
  completed: boolean;
  hoursWorked?: number;
  electricianId?: string;
  date?: string;
}

interface Material {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

interface Report {
  id: string;
  title: string;
  author: string;
  date: string;
}

/**
 * System Notification
 * Real-time alerts broadcast via WebSocket
 */
interface AppNotification {
  id: number;
  message: string;
  timestamp: Date;
  read: boolean;
}

// --- Components ---

/**
 * Edit/Delete action buttons for table rows
 * Shows on hover for better UX
 */
function TableActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={onEdit} className="p-1 hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors rounded">
        <Pencil className="w-4 h-4" />
      </button>
      <button onClick={onDelete} className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors rounded">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: any; 
  label: string; 
  active: boolean; 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all rounded-lg ${
      active 
        ? 'bg-blue-600/10 text-blue-400' 
        : 'text-slate-400 hover:text-white hover:bg-slate-800'
    }`}
  >
    <Icon className="w-5 h-5" />
    <span className={active ? 'italic' : ''}>{label}</span>
  </button>
);

export default function App() {
  // ============ AUTH & UI STATE ============
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('user') || 'null'));
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // ============ FILTER & SEARCH STATE ============
  const [searchKeyword, setSearchKeyword] = useState('');
  const [taskFilter, setTaskFilter] = useState('All');
  const [electricianFilter, setElectricianFilter] = useState('All');

  // ============ NOTIFICATIONS STATE ============
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // ============ LOADING & ERRORS ============
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [data, setData] = useState<{
    electricians: Electrician[];
    jobs: Job[];
    tasks: Task[];
    materials: Material[];
    reports: Report[];
    stats?: any;
    reportDaily?: any[];
    reportCompletion?: any;
    reportElectrician?: any[];
  }>({
    electricians: [],
    jobs: [],
    tasks: [],
    materials: [],
    reports: [],
  });

  // WebSocket connection for real-time notifications
  const socketRef = useRef<Socket | null>(null);

  /**
   * Fetch all system data based on current filters and search
   * Parallelizes requests for faster loading
   */
  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const jobUrl = searchKeyword ? `/api/jobs/search?keyword=${searchKeyword}` : '/api/jobs';
      const taskUrl = taskFilter !== 'All' ? `/api/tasks?status=${taskFilter}` : '/api/tasks?status=All';
      const elecUrl = electricianFilter !== 'All' ? `/api/electricians?availability=${electricianFilter}` : '/api/electricians';

      const [eRes, jRes, tRes, mRes, rRes, statsRes] = await Promise.all([
        api.get(elecUrl),
        api.get(jobUrl),
        api.get(taskUrl),
        api.get('/api/materials'),
        api.get('/api/reports'),
        api.get('/api/dashboard/stats')
      ]);

      setData({ 
        electricians: eRes.data || [], 
        jobs: jRes.data || [], 
        tasks: tRes.data || [], 
        materials: mRes.data || [], 
        reports: rRes.data || [],
        stats: statsRes.data || {}
      });
    } catch (err) {
      console.error('Failed to fetch data', err);
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
      socketRef.current = io();
      socketRef.current.on('notification', (notif: any) => {
        setNotifications(prev => [{ ...notif, read: false }, ...prev].slice(0, 50));
      });
    }
    return () => {
      socketRef.current?.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => fetchData(), 300);
      return () => clearTimeout(timer);
    }
  }, [searchKeyword, taskFilter, electricianFilter]);

  /**
   * Handle user authentication
   * Sends credentials to server, receives JWT token
   * Stores token and user profile in localStorage
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = (e.target as any).email.value;
    const password = (e.target as any).password.value;
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      }).then(r => r.json());

      if (res.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        setSuccessMsg('Welcome back!');
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Login service unavailable');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setActiveView('dashboard');
  };

  const handleCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, endpoint: string) => {
    if (!window.confirm('Are you sure you want to delete this?')) return;
    try {
      const res = await api.delete(`/api/${endpoint}/${id}`);
      if (res.ok) {
        setSuccessMsg('Deleted successfully');
        await fetchData();
      } else {
        setError('Unauthorized deletion attempt');
      }
    } catch (err) {
      setError('Delete error');
    }
  };

  const handleSubmit = async (formData: any) => {
    const isEdit = !!editingItem;
    const url = isEdit ? `/api/${activeView}/${editingItem.id}` : `/api/${activeView}`;

    try {
      console.log('📤 Submitting to:', url, formData);
      const res = isEdit ? await api.put(url, formData) : await api.post(url, formData);
      console.log('📥 Response:', res);

      if (res.success) {
        const msg = isEdit ? '✅ Updated successfully' : '✅ Created successfully';
        setSuccessMsg(msg);
        console.log(msg);
        alert(msg);
        setIsModalOpen(false);
        setEditingItem(null);
        setError(null);
        await new Promise(r => setTimeout(r, 100));
        await fetchData();
      } else {
        const errMsg = res.message || 'Operation failed';
        setError(errMsg);
        console.error('❌', errMsg);
        alert('Error: ' + errMsg);
      }
    } catch (err: any) {
      const errMsg = err.message || 'Submission failed';
      setError(errMsg);
      console.error('❌ Error:', err);
      alert('Error: ' + errMsg);
    }
  };

  const isAdmin = user?.role === 'Admin';
  const isElectrician = user?.role === 'Electrician';

  if (!user) {
    return <LoginView onLogin={handleLogin} loading={loading} error={error} />;
  }

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView data={data} setActiveView={setActiveView} onEdit={handleEdit} onDelete={handleDelete} isAdmin={isAdmin} />;
      case 'electricians':
        return <ElectriciansView items={data.electricians} onEdit={handleEdit} onDelete={handleDelete} filter={electricianFilter} setFilter={setElectricianFilter} />;
      case 'jobs':
        return <JobsView items={data.jobs} onEdit={handleEdit} onDelete={handleDelete} />;
      case 'tasks':
        return <TasksView items={data.tasks} onEdit={handleEdit} onDelete={handleDelete} filter={taskFilter} setFilter={setTaskFilter} isAdmin={isAdmin} user={user} fetchData={fetchData} />;
      case 'reports':
        return <ReportsView data={data} />;
      case 'materials':
        return <MaterialsView items={data.materials} onEdit={handleEdit} onDelete={handleDelete} />;
      default:
        return <DashboardView data={data} setActiveView={setActiveView} onEdit={handleEdit} onDelete={handleDelete} isAdmin={isAdmin} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar ... */}
      <aside className="w-64 bg-slate-900 flex flex-col">
        {/* ... */}
        <div className="p-6">
          <div className="flex items-center gap-3 text-blue-400 font-bold text-xl tracking-tight">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-xs">
              V
            </div>
            <span>VoltManager</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 py-4">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={activeView === 'dashboard'} 
            onClick={() => setActiveView('dashboard')} 
          />
          {isAdmin && (
            <>
              <div className="px-4 py-2 mt-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Management</div>
              <SidebarItem 
                icon={Users} 
                label="Electricians" 
                active={activeView === 'electricians'} 
                onClick={() => setActiveView('electricians')} 
              />
            </>
          )}
          <div className="px-4 py-2 mt-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Operations</div>
          <SidebarItem 
            icon={Briefcase} 
            label="Jobs" 
            active={activeView === 'jobs'} 
            onClick={() => setActiveView('jobs')} 
          />
          <SidebarItem 
            icon={CheckSquare} 
            label="Tasks" 
            active={activeView === 'tasks'} 
            onClick={() => setActiveView('tasks')} 
          />
          <div className="px-4 py-2 mt-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Resources</div>
          <SidebarItem 
            icon={Package} 
            label="Materials" 
            active={activeView === 'materials'} 
            onClick={() => setActiveView('materials')} 
          />
          <SidebarItem 
            icon={FileText} 
            label="Reports" 
            active={activeView === 'reports'} 
            onClick={() => setActiveView('reports')} 
          />
        </nav>

        <div className="p-6 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-semibold text-white">{user.name}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{user.role}</p>
              </div>
            </div>
            <button onClick={logout} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <h1 className="text-lg font-semibold text-slate-800 capitalize">
            {activeView === 'dashboard' ? 'Operations Overview' : activeView}
          </h1>
          
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" />
              <input 
                type="text" 
                placeholder="Search jobs, locations..." 
                className="pl-10 pr-4 py-2 bg-slate-100 border-transparent border rounded-lg text-sm focus:bg-white focus:border-slate-300 outline-none transition-all w-64"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Notifications</h3>
                      <button onClick={() => setNotifications([])} className="text-[10px] text-blue-600 font-bold hover:underline">Clear all</button>
                    </div>
                    <div className="max-h-96 overflow-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                          <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          <p className="text-sm uppercase font-bold tracking-tighter">Stay updated!</p>
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <p className="text-sm text-slate-800">{n.message}</p>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">{format(new Date(n.timestamp), 'HH:mm')}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {activeView !== 'dashboard' && isAdmin && (
              <button 
                onClick={handleCreate}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition-all shadow-sm shadow-blue-200"
              >
                <Plus className="w-4 h-4" />
                New {activeView.slice(0, -1)}
              </button>
            )}
          </div>
        </header>

        {/* View Container */}
        <div className="p-8 h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full space-y-6"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {isModalOpen && (
        <FormModal 
          view={activeView} 
          item={editingItem} 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={handleSubmit} 
        />
      )}
    </div>
  );
}

// --- Form Modal ---

function FormModal({
  view,
  item,
  onClose,
  onSubmit
}: {
  view: View;
  item: any;
  onClose: () => void;
  onSubmit: (data: any) => void
}) {
  const getDefaultValues = () => {
    if (item) return item;

    const defaults: Record<string, any> = {
      electricians: {
        name: '',
        level: 'Apprentice',
        status: 'Active',
        availability: 'Available'
      },
      jobs: {
        title: '',
        location: '',
        status: 'Scheduled',
        assignedTo: ''
      },
      tasks: {
        description: '',
        priority: 'Medium',
        jobId: '',
        completed: false,
        hoursWorked: 0,
        electricianId: ''
      },
      materials: {
        name: '',
        quantity: 0,
        unit: 'pcs'
      },
      reports: {
        title: '',
        author: '',
        date: new Date().toISOString().split('T')[0]
      }
    };

    return defaults[view as string] || {};
  };

  const [formData, setFormData] = useState(getDefaultValues());

  const fields: Record<string, { label: string; type: string; key: string }[]> = {
    electricians: [
      { label: 'Name', type: 'text', key: 'name' },
      { label: 'Level', type: 'text', key: 'level' },
      { label: 'Status', type: 'text', key: 'status' },
      { label: 'Availability', type: 'text', key: 'availability' },
    ],
    jobs: [
      { label: 'Title', type: 'text', key: 'title' },
      { label: 'Location', type: 'text', key: 'location' },
      { label: 'Status', type: 'text', key: 'status' },
      { label: 'Assigned To', type: 'text', key: 'assignedTo' },
      { label: 'Deadline', type: 'date', key: 'deadline' },
    ],
    tasks: [
      { label: 'Description', type: 'text', key: 'description' },
      { label: 'Priority', type: 'text', key: 'priority' },
      { label: 'Job ID', type: 'text', key: 'jobId' },
      { label: 'Electrician ID', type: 'text', key: 'electricianId' },
      { label: 'Hours Worked', type: 'number', key: 'hoursWorked' },
    ],
    materials: [
      { label: 'Name', type: 'text', key: 'name' },
      { label: 'Quantity', type: 'number', key: 'quantity' },
      { label: 'Unit', type: 'text', key: 'unit' },
    ],
    reports: [
      { label: 'Title', type: 'text', key: 'title' },
      { label: 'Author', type: 'text', key: 'author' },
      { label: 'Date', type: 'date', key: 'date' },
    ],
  };

  const currentFields = fields[view as string] || [];

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">
            {item ? 'Edit' : 'New'} {view.slice(0, -1)}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-xl">×</button>
        </div>
        <form 
          className="p-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(formData);
          }}
        >
          {currentFields.map((field) => (
            <div key={field.key}>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                {field.label}
              </label>
              <input
                type={field.type}
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none transition-all"
                value={formData[field.key] || ''}
                onChange={(e) => {
                  setFormData({ ...formData, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value });
                }}
              />
            </div>
          ))}
          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// --- Views ---

function DashboardView({ data, setActiveView, onEdit, onDelete, isAdmin }: { data: any; setActiveView: (view: View) => void; onEdit: (item: any) => void; onDelete: (id: string, mod: string) => void; isAdmin: boolean }) {
  const stats = data.stats || { totalTasks: 0, completed: 0, pending: 0, charts: {} };
  
  const pieData = {
    labels: ['Completed', 'Pending', 'In Progress'],
    datasets: [{
      data: stats.charts?.statusDistribution?.map((d: any) => d.value) || [0, 0, 0],
      backgroundColor: ['#10b981', '#f59e0b', '#3b82f6'],
      borderWidth: 0,
    }]
  };

  const tasksByDayData = {
    labels: stats.charts?.tasksByDay?.map((d: any) => d.date) || [],
    datasets: [{
      label: 'Tasks Created',
      data: stats.charts?.tasksByDay?.map((d: any) => d.count) || [],
      backgroundColor: '#3b82f6',
      borderRadius: 4,
    }]
  };

  const performanceData = {
    labels: stats.charts?.performance?.map((d: any) => d.name) || [],
    datasets: [{
      label: 'Tasks Completed',
      data: stats.charts?.performance?.map((d: any) => d.completed) || [],
      backgroundColor: '#10b981',
      borderRadius: 4,
    }]
  };

  return (
    <div className="space-y-8 flex flex-col h-full bg-slate-50/50 p-1 rounded-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total System Tasks" 
          value={stats.totalTasks} 
          change={`Completed: ${stats.completed}`} 
          color="text-blue-600" 
          icon={CheckSquare}
        />
        <StatCard 
          label="Active Electricians" 
          value={data.electricians.filter((e:any) => e.availability === 'Busy').length} 
          change={`Out of ${data.electricians.length} total`} 
          icon={UserIcon}
        />
        <StatCard 
          label="Open Job Depth" 
          value={data.jobs.length} 
          change="Updated live" 
          color="text-amber-600" 
          icon={Briefcase}
        />
        <StatCard 
          label="System Health" 
          value="Secure" 
          change="JWT Protected" 
          color="text-green-600" 
          icon={ShieldCheck}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-6">Status Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            <Pie data={pieData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-6">Tasks Over Time</h3>
          <div className="h-64">
            <Bar data={tasksByDayData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-6">Electrician Performance</h3>
          <div className="h-64">
            <Bar data={performanceData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, indexAxis: 'y' as const }} />
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 tracking-tight">Active Operation Pipeline</h3>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mt-1">Live Job tracking</p>
            </div>
            <button 
              onClick={() => setActiveView('jobs')}
              className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              View Full List
            </button>
          </div>
          <div className="overflow-auto flex-1">
            <table className="w-full text-left font-sans">
              <thead className="bg-slate-50/50 sticky top-0">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Project Type</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.jobs.slice(0, 5).map((job: any) => (
                  <tr key={job.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5 text-sm font-medium text-slate-900">{job.location}</td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-600">{job.title}</span>
                        {job.deadline && <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">Due {job.deadline}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm",
                        job.status === 'In Progress' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      )}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      {isAdmin && (
                        <div className="flex justify-end pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <TableActions 
                            onEdit={() => {
                              setActiveView('jobs');
                              onEdit(job);
                            }} 
                            onDelete={() => onDelete(job.id, 'jobs')} 
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <FileUploadSection isAdmin={isAdmin} />
      </div>
    </div>
  );
}

function FileUploadSection({ isAdmin }: { isAdmin: boolean }) {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<any[]>([]);

  const handleUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const endpoint = isAdmin ? '/api/upload/report' : '/api/upload/image';
      const field = isAdmin ? 'report' : 'image';
      const res = await api.upload(endpoint, file, field);
      if (res.success) {
        setFiles(prev => [res.data, ...prev]);
        alert('File uploaded successfully!');
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h3 className="font-bold text-slate-800 tracking-tight">Resource Center</h3>
        <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mt-1">{isAdmin ? 'Admin Uploads' : 'Evidence Upload'}</p>
      </div>
      <div className="p-6 flex-1 overflow-auto space-y-4">
        <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group">
          <Upload className={cn("w-8 h-8 text-slate-300 group-hover:text-blue-500 mb-2 transition-colors", uploading && "animate-bounce")} />
          <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">{uploading ? 'Processing...' : 'Click to Upload'}</p>
          <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">PNG, JPG, PDF (Max 5MB)</p>
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>

        <div className="space-y-3">
          {files.map(f => (
            <div key={f.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {f.type === 'image' ? <ImageIcon className="w-4 h-4 text-blue-500" /> : <FileText className="w-4 h-4 text-red-500" />}
                <div>
                  <p className="text-[11px] font-bold text-slate-800 leading-none">File ID: {f.id}</p>
                  <p className="text-[9px] text-slate-400 uppercase font-bold mt-1 tracking-widest">{format(new Date(f.timestamp), 'HH:mm')}</p>
                </div>
              </div>
              <a href={f.path} target="_blank" className="p-1 hover:bg-white rounded transition-colors text-slate-400 hover:text-blue-600">
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoginView({ onLogin, loading, error }: { onLogin: (e: any) => void; loading: boolean; error: string | null }) {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-2xl shadow-blue-500/20">
            V
          </div>
        </div>
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">VoltManager Pro</h1>
          <p className="text-slate-400 text-sm text-center mb-8 uppercase font-bold tracking-widest">Secure Contractor Portal</p>
          
          <form onSubmit={onLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">Email System Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  name="email"
                  type="email" 
                  placeholder="admin@voltmanager.com"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">Access Credentials</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  name="password"
                  type="password" 
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-500 text-xs font-bold rounded-lg flex items-center gap-2 animate-pulse">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  AUTHENTICATE
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-50 text-center">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Enterprise Edition v5.0.4</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({ label, value, change, color = 'text-slate-400', icon: Icon }: { label: string; value: any; change: string; color?: string; icon: any }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-16 h-16" />
      </div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <div className="flex items-baseline gap-2 mt-3">
        <span className="text-3xl font-bold text-slate-900 tracking-tight">{value}</span>
      </div>
      <p className={cn("text-[11px] mt-2 font-bold uppercase italic tracking-tighter opacity-70", color)}>{change}</p>
    </div>
  );
}

function ElectriciansView({ items, onEdit, onDelete, filter, setFilter }: { items: Electrician[]; onEdit: (item: any) => void; onDelete: (id: string, mod: string) => void; filter: string; setFilter: (f: string) => void }) {
  return (
    <div className="space-y-4 flex flex-col h-full">
      <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200">
        <Filter className="w-4 h-4 text-slate-400 ml-2" />
        {['All', 'Available', 'Busy'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all",
              filter === f ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:bg-slate-100"
            )}
          >
            {f}
          </button>
        ))}
      </div>
      <DataTable 
        headers={['Name', 'Level', 'Status', 'Availability', 'Actions']}
        items={items}
        renderRow={(item) => (
          <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors group">
            <td className="py-4 px-6 text-sm font-medium text-slate-900">{item.name}</td>
            <td className="py-4 px-6 text-sm text-slate-600 font-mono italic">{item.level}</td>
            <td className="py-4 px-6">
              <span className={cn(
                "px-2 py-1 text-[11px] font-bold rounded-md uppercase",
                item.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
              )}>
                {item.status}
              </span>
            </td>
            <td className="py-4 px-6">
               <span className={cn(
                "px-2 py-1 text-[11px] font-bold rounded-md uppercase",
                item.availability === 'Available' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
              )}>
                {item.availability}
              </span>
            </td>
            <td className="py-4 px-6">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <TableActions onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id, 'electricians')} />
              </div>
            </td>
          </tr>
        )}
      />
    </div>
  );
}

function JobsView({ items, onEdit, onDelete }: { items: Job[]; onEdit: (item: any) => void; onDelete: (id: string, mod: string) => void }) {
  return (
    <DataTable 
      headers={['Title', 'Location', 'Status', 'Assigned To', 'Actions']}
      items={items}
      renderRow={(item) => (
        <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
          <td className="px-6 py-4 text-sm font-medium text-slate-900">{item.title}</td>
          <td className="px-6 py-4 text-sm text-slate-600">{item.location}</td>
          <td className="px-6 py-4">
             <span className={`px-2 py-1 text-[11px] font-bold rounded-md uppercase ${
              item.status === 'In Progress' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {item.status}
            </span>
          </td>
          <td className="px-6 py-4 text-sm text-slate-500 italic">Electrician #{item.assignedTo}</td>
          <td className="px-6 py-4">
            <TableActions onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id, 'jobs')} />
          </td>
        </tr>
      )}
    />
  );
}

function TasksView({ items, onEdit, onDelete, filter, setFilter, isAdmin, user, fetchData }: { items: Task[]; onEdit: (item: any) => void; onDelete: (id: string, mod: string) => void; filter: string; setFilter: (f: string) => void; isAdmin: boolean; user: any; fetchData: () => void }) {
  const toggleStatus = async (item: Task) => {
    try {
      const res = await api.put(`/api/tasks/${item.id}`, { ...item, completed: !item.completed });
      if (res.success) fetchData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="space-y-4 flex flex-col h-full">
      <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200">
        <Filter className="w-4 h-4 text-slate-400 ml-2" />
        {['All', 'Pending', 'Completed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all",
              filter === f ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:bg-slate-100"
            )}
          >
            {f}
          </button>
        ))}
      </div>
      <DataTable 
        headers={['Description', 'Priority', 'JobId', 'Assignee', 'Status', 'Actions']}
        items={items}
        renderRow={(item) => (
          <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors group">
            <td className="px-6 py-4 text-sm text-slate-900 font-medium">{item.description}</td>
            <td className="px-6 py-4">
              <span className={cn(
                "text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                item.priority === 'High' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
              )}>
                {item.priority}
              </span>
            </td>
            <td className="px-6 py-4 text-sm text-slate-500 font-mono italic">#{item.jobId}</td>
            <td className="px-6 py-4">
               <span className={cn(
                "px-2 py-1 text-[11px] font-bold rounded-md uppercase",
                item.completed ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'
              )}>
                {item.completed ? 'Completed' : 'Pending'}
              </span>
            </td>
            <td className="px-6 py-4">
              {isAdmin && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <TableActions onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id, 'tasks')} />
                </div>
              )}
            </td>
          </tr>
        )}
      />
    </div>
  );
}

function ReportsView({ data }: { data: any }) {
  const [subView, setSubView] = useState<'meta' | 'daily' | 'completion' | 'electrician'>('meta');

  const renderSubView = () => {
    switch (subView) {
      case 'daily':
        return (
          <DataTable 
            headers={['Date', 'Electrician', 'Task', 'Status', 'Hours']}
            items={data.reportDaily || []}
            renderRow={(item, idx) => (
              <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50/50 text-sm">
                <td className="px-6 py-4 font-mono">{item.date}</td>
                <td className="px-6 py-4 font-medium">{item.electricianName}</td>
                <td className="px-6 py-4">{item.taskName}</td>
                <td className="px-6 py-4">
                  <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase", item.status === 'Completed' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-600')}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono italic">{item.hoursWorked}h</td>
              </tr>
            )}
          />
        );
      case 'completion':
        const c = data.reportCompletion || {};
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 flex flex-col justify-center items-center">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Total Task Depth</p>
              <p className="text-6xl font-bold text-slate-900 leading-tight">{c.total}</p>
              <div className="mt-8 grid grid-cols-2 gap-8 w-full text-center">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Completed</p>
                  <p className="text-xl font-bold text-blue-600">{c.completed}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Pending</p>
                  <p className="text-xl font-bold text-amber-600">{c.pending}</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 flex flex-col justify-center items-center text-white">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Completion Velocity</p>
              <p className="text-6xl font-bold leading-tight">{c.rate}%</p>
              <p className="text-xs text-blue-400 font-bold uppercase mt-2">Internal Benchmark: 85%</p>
              <div className="w-full h-2 bg-white/10 rounded-full mt-10 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${c.rate}%` }} className="h-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
              </div>
            </div>
          </div>
        );
      case 'electrician':
        return (
          <DataTable 
            headers={['Electrician', 'Assigned', 'Completed', 'Pending', 'Activity']}
            items={data.reportElectrician || []}
            renderRow={(item, idx) => (
              <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50/50 text-sm">
                <td className="px-6 py-4 font-bold">{item.name}</td>
                <td className="px-6 py-4">{item.assigned}</td>
                <td className="px-6 py-4 text-blue-600 font-bold">{item.completed}</td>
                <td className="px-6 py-4 text-amber-600 font-bold">{item.pending}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 rounded bg-slate-50 text-[10px] font-bold uppercase text-slate-400">{item.lastActivity}</span>
                </td>
              </tr>
            )}
          />
        );
      default:
        return (
          <DataTable 
            headers={['Title', 'Author', 'Date', 'Type']}
            items={data.reports}
            renderRow={(item) => (
              <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                <td className="px-6 py-4 text-sm font-medium text-slate-900">{item.title}</td>
                <td className="px-6 py-4 text-sm text-slate-600 italic">{item.author}</td>
                <td className="px-6 py-4 text-sm text-slate-500 font-mono">{item.date}</td>
                <td className="px-6 py-4">
                   <button className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors uppercase tracking-widest">
                     <Download className="w-3 h-3" />
                     PDF
                   </button>
                </td>
              </tr>
            )}
          />
        );
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { id: 'meta', label: 'Archived', icon: FileText },
          { id: 'daily', label: 'Daily Work', icon: Calendar },
          { id: 'completion', label: 'Completion', icon: BarChart3 },
          { id: 'electrician', label: 'Activities', icon: Users },
        ].map(btn => (
          <button
            key={btn.id}
            onClick={() => setSubView(btn.id as any)}
            className={cn(
              "flex flex-col items-center justify-center p-4 rounded-xl border transition-all space-y-2",
              subView === btn.id 
                ? "bg-white border-blue-200 shadow-md scale-[1.02]" 
                : "bg-white/50 border-slate-200 hover:bg-white text-slate-400"
            )}
          >
            <btn.icon className={cn("w-5 h-5", subView === btn.id ? "text-blue-600" : "text-slate-300")} />
            <span className={cn("text-[10px] font-bold uppercase tracking-widest", subView === btn.id ? "text-slate-800" : "text-slate-400")}>
              {btn.label}
            </span>
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {renderSubView()}
      </div>
    </div>
  );
}

function MaterialsView({ items, onEdit, onDelete }: { items: Material[]; onEdit: (item: any) => void; onDelete: (id: string, mod: string) => void }) {
  return (
    <DataTable 
      headers={['Item Name', 'Quantity', 'Unit', 'Status', 'Actions']}
      items={items}
      renderRow={(item) => (
        <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
          <td className="px-6 py-4 text-sm font-medium text-slate-900">{item.name}</td>
          <td className="px-6 py-4 text-sm text-slate-600 font-mono">{item.quantity}</td>
          <td className="px-6 py-4 text-sm text-slate-500 uppercase">{item.unit}</td>
          <td className="px-6 py-4">
             <span className={`px-2 py-1 text-[11px] font-bold rounded-md uppercase ${
              item.quantity < 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              {item.quantity < 10 ? 'Low Stock' : 'In Stock'}
            </span>
          </td>
          <td className="px-6 py-4">
            <TableActions onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id, 'materials')} />
          </td>
        </tr>
      )}
    />
  );
}

function DataTable({ headers, items, renderRow }: { headers: string[]; items: any[]; renderRow: (item: any, idx: number) => React.ReactElement }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="overflow-auto flex-1">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 sticky top-0">
            <tr>
              {headers.map(header => (
                <th key={header} className="py-3 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, idx) => renderRow(item, idx))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
