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
  RefreshCw,
  ImageIcon,
  CreditCard,
  History,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import { format } from 'date-fns';
import { toast, Toaster } from 'react-hot-toast';
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
  }).then(res => res.json()),
  
  post: (url: string, data: any) => fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(data),
  }).then(res => res.json()),

  put: (url: string, data: any) => fetch(url, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(data),
  }).then(res => res.json()),

  delete: (url: string) => fetch(url, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  }),

  upload: (url: string, file: File, fieldName: string, extraFields?: Record<string, string>) => {
    const formData = new FormData();
    formData.append(fieldName, file);
    Object.entries(extraFields || {}).forEach(([key, value]) => {
      formData.append(key, value);
    });
    return fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: formData
    }).then(res => res.json());
  }
};

// --- Types ---

type View = 'dashboard' | 'electricians' | 'jobs' | 'tasks' | 'reports' | 'materials' | 'payments' | 'clients';

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
  clientId?: string;
  amount?: number;
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

interface Client {
  id: string;
  userId: string;
  name: string;
  company: string;
  phone: string;
}

interface Payment {
  id: string;
  payer_id: string;
  payer_name?: string;
  receiver_id: string;
  receiver_name?: string;
  job_id: string;
  job_title?: string;
  amount: number;
  currency: string;
  payment_type: string;
  status: string;
  created_at: string;
  gateway_payment_id?: string;
}

interface AppNotification {
  id: number;
  message: string;
  timestamp: Date;
  read: boolean;
}

// --- Components ---

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
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('user') || 'null'));
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [taskFilter, setTaskFilter] = useState('All');
  const [electricianFilter, setElectricianFilter] = useState('All');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const [data, setData] = useState<{
    electricians: Electrician[];
    jobs: Job[];
    tasks: Task[];
    materials: Material[];
    reports: Report[];
    payments: Payment[];
    clients: Client[];
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
    payments: [],
    clients: [],
  });

  const socketRef = useRef<Socket | null>(null);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const jobUrl = '/api/jobs';
      const taskUrl = '/api/tasks?status=All';
      const elecUrl = '/api/electricians';
      const paymentUrl = user.role === 'Admin' ? '/api/payments' : '/api/payments/my-payments';

      const [eRes, jRes, tRes, mRes, rRes, statsRes, pRes, cRes] = await Promise.all([
        api.get(elecUrl),
        api.get(jobUrl),
        api.get(taskUrl),
        api.get('/api/materials'),
        api.get('/api/reports'),
        api.get('/api/dashboard/stats'),
        api.get(paymentUrl),
        api.get('/api/clients')
      ]);

      setData({ 
        electricians: eRes.data || [], 
        jobs: jRes.data || [], 
        tasks: tRes.data || [], 
        materials: mRes.data || [], 
        reports: rRes.data || [],
        stats: statsRes.data || {},
        payments: pRes.data || [],
        clients: cRes.data || []
      });
    } catch (err) {
      console.error('Failed to fetch data', err);
      toast.error('Sync failed. Please check your connection.');
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
    if (!['electricians', 'jobs', 'tasks', 'materials', 'clients'].includes(activeView)) {
      toast.error('This section is read-only.');
      return;
    }
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
      const res = isEdit ? await api.put(url, formData) : await api.post(url, formData);
      if (res.success) {
        setSuccessMsg(isEdit ? 'Updated successfully' : 'Created successfully');
        setIsModalOpen(false);
        fetchData();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Submission failed');
    }
  };

  const isAdmin = user?.role === 'Admin';
  const isElectrician = user?.role === 'Electrician';

  if (!user) {
    return <LoginView onLogin={handleLogin} loading={loading} error={error} />;
  }

  const filteredData = (view: View) => {
    const keyword = searchKeyword.toLowerCase();
    switch (view) {
      case 'jobs':
        return data.jobs.filter(j => j.title.toLowerCase().includes(keyword) || j.location.toLowerCase().includes(keyword));
      case 'electricians':
        const filteredElecs = electricianFilter === 'All' ? data.electricians : data.electricians.filter(e => e.availability === electricianFilter);
        return filteredElecs.filter(e => e.name.toLowerCase().includes(keyword) || e.skillset?.toLowerCase().includes(keyword));
      case 'tasks':
        const filteredTasks = taskFilter === 'All' ? data.tasks : data.tasks.filter(t => t.completed === (taskFilter === 'Completed'));
        return filteredTasks.filter(t => t.description.toLowerCase().includes(keyword));
      case 'payments':
        return data.payments.filter(p => p.gateway_payment_id?.toLowerCase().includes(keyword) || p.payment_type.toLowerCase().includes(keyword));
      case 'clients':
        return data.clients.filter(c => c.name.toLowerCase().includes(keyword) || c.address.toLowerCase().includes(keyword));
      case 'materials':
        return data.materials.filter(m => m.name.toLowerCase().includes(keyword));
      case 'reports':
        return data.reports.filter(r => r.title.toLowerCase().includes(keyword));
      default:
        return [];
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView data={data} setActiveView={setActiveView} onEdit={handleEdit} onDelete={handleDelete} isAdmin={isAdmin} user={user} onSync={fetchData} />;
      case 'electricians':
        return <ElectriciansView items={filteredData('electricians')} onEdit={handleEdit} onDelete={handleDelete} filter={electricianFilter} setFilter={setElectricianFilter} />;
      case 'jobs':
        return <JobsView items={filteredData('jobs')} onEdit={handleEdit} onDelete={handleDelete} electricians={data.electricians} />;
      case 'tasks':
        return <TasksView items={filteredData('tasks')} data={data} onEdit={handleEdit} onDelete={handleDelete} filter={taskFilter} setFilter={setTaskFilter} isAdmin={isAdmin} user={user} fetchData={fetchData} />;
      case 'reports':
        return <ReportsView data={{ ...data, reports: filteredData('reports') }} onRefresh={fetchData} isAdmin={isAdmin} user={user} />;
      case 'materials':
        return <MaterialsView items={filteredData('materials')} onEdit={handleEdit} onDelete={handleDelete} />;
      case 'payments':
        return <PaymentsView items={filteredData('payments')} data={data} fetchData={fetchData} user={user} />;
      case 'clients':
        return <ClientsView items={filteredData('clients')} onEdit={handleEdit} onDelete={handleDelete} />;
      default:
        return <DashboardView data={data} setActiveView={setActiveView} onEdit={handleEdit} onDelete={handleDelete} isAdmin={isAdmin} user={user} onSync={fetchData} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Toaster position="top-right" />
      {/* Sidebar ... */}
      <aside className="w-64 bg-slate-900 flex flex-col shadow-2xl">
        <div className="p-6">
          <div className="flex items-center gap-3 text-blue-400 font-bold text-xl tracking-tight">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-xs shadow-lg shadow-blue-500/30">
              V
            </div>
            <span className="tracking-tighter">VoltManager</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 py-4 overflow-y-auto">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={activeView === 'dashboard'} 
            onClick={() => setActiveView('dashboard')} 
          />
          {isAdmin && (
            <>
              <div className="px-4 py-2 mt-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-50">Management</div>
              <SidebarItem 
                icon={Users} 
                label="Electricians" 
                active={activeView === 'electricians'} 
                onClick={() => setActiveView('electricians')} 
              />
            </>
          )}
          <div className="px-4 py-2 mt-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-50">Operations</div>
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
          <div className="px-4 py-2 mt-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-50">Finance</div>
          {isAdmin && (
            <SidebarItem 
              icon={Users} 
              label="Clients" 
              active={activeView === 'clients'} 
              onClick={() => setActiveView('clients')} 
            />
          )}
          <SidebarItem 
            icon={CreditCard} 
            label="Payments" 
            active={activeView === 'payments'} 
            onClick={() => setActiveView('payments')} 
          />
          <div className="px-4 py-2 mt-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-50">Resources</div>
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

        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold shadow-md shadow-blue-500/20">
                {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate w-24">{user.name}</p>
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
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm shadow-slate-100">
          <div className="flex items-center gap-4">
             <h1 className="text-lg font-bold text-slate-800 capitalize tracking-tight">
              {activeView === 'dashboard' ? 'Operations Overview' : activeView}
            </h1>
            {activeView !== 'dashboard' && isAdmin && ['electricians', 'jobs', 'tasks', 'materials', 'clients'].includes(activeView) && (
                <button 
                  onClick={handleCreate}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-md shadow-blue-200 uppercase tracking-widest"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create
                </button>
              )}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative group hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search resources..." 
                className="pl-10 pr-4 py-2 bg-slate-100 border-transparent border rounded-lg text-sm focus:bg-white focus:border-slate-300 outline-none transition-all w-64 font-medium"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors bg-slate-100 rounded-lg"
              >
                <Bell className="w-5 h-5" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                      <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Global Notifications</h3>
                      <button onClick={() => setNotifications([])} className="text-[10px] text-blue-600 font-bold hover:underline">Clear all</button>
                    </div>
                    <div className="max-h-96 overflow-auto">
                      {notifications.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                          <Bell className="w-10 h-10 mx-auto mb-3 opacity-20" />
                          <p className="text-[10px] uppercase font-bold tracking-widest">No new updates</p>
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <p className="text-sm text-slate-800 leading-snug">{n.message}</p>
                            <p className="text-[10px] text-slate-400 mt-2 uppercase font-bold tracking-widest">{format(new Date(n.timestamp), 'HH:mm:ss')}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* View Container */}
        <div className="p-8 h-full min-h-0">
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
          data={data}
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
  onSubmit,
  data
}: { 
  view: View; 
  item: any; 
  onClose: () => void; 
  onSubmit: (data: any) => void;
  data: any;
}) {
  const [formData, setFormData] = useState(item || {});

  const fields: Record<string, { label: string; type: string; key: string; options?: { value: string; label: string }[] }[]> = {
    electricians: [
      { label: 'Name', type: 'text', key: 'name' },
      { label: 'Level', type: 'select', key: 'level', options: [
        { value: 'Apprentice', label: 'Apprentice' },
        { value: 'Journeyman', label: 'Journeyman' },
        { value: 'Master', label: 'Master' },
      ]},
      { label: 'Status', type: 'select', key: 'status', options: [
        { value: 'Active', label: 'Active' },
        { value: 'In-active', label: 'In-active' },
      ]},
      { label: 'Availability', type: 'select', key: 'availability', options: [
        { value: 'Available', label: 'Available' },
        { value: 'Busy', label: 'Busy' },
      ]},
    ],
    jobs: [
      { label: 'Title', type: 'text', key: 'title' },
      { label: 'Location', type: 'text', key: 'location' },
      { label: 'Client', type: 'select', key: 'clientId', options: data.clients.map((c:any) => ({ value: c.id, label: `${c.name} (${c.company})` })) },
      { label: 'Status', type: 'select', key: 'status', options: [
        { value: 'Scheduled', label: 'Scheduled' },
        { value: 'In Progress', label: 'In Progress' },
        { value: 'Completed', label: 'Completed' },
        { value: 'Paid', label: 'Paid' },
      ]},
      { label: 'Assigned Electrician', type: 'select', key: 'assignedTo', options: data.electricians.map((e:any) => ({ value: e.id, label: e.name })) },
      { label: 'Amount (₹)', type: 'number', key: 'amount' },
      { label: 'Deadline', type: 'date', key: 'deadline' },
    ],
    tasks: [
      { label: 'Job', type: 'select', key: 'jobId', options: data.jobs.map((j:any) => ({ value: j.id, label: j.title })) },
      { label: 'Description', type: 'text', key: 'description' },
      { label: 'Priority', type: 'select', key: 'priority', options: [
        { value: 'High', label: 'High' },
        { value: 'Medium', label: 'Medium' },
        { value: 'Low', label: 'Low' },
      ]},
      { label: 'Assigned Electrician', type: 'select', key: 'electricianId', options: data.electricians.map((e:any) => ({ value: e.id, label: e.name })) },
    ],
    materials: [
      { label: 'Name', type: 'text', key: 'name' },
      { label: 'Quantity', type: 'number', key: 'quantity' },
      { label: 'Unit', type: 'text', key: 'unit' },
    ],
    clients: [
      { label: 'Name', type: 'text', key: 'name' },
      { label: 'Company', type: 'text', key: 'company' },
      { label: 'Phone', type: 'text', key: 'phone' },
    ],
  };

  const currentFields = fields[view as string] || [];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
      >
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              {item ? 'Modify' : 'Create'} {view.slice(0, -1)}
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Enterprise Asset Entry</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-all font-bold text-xl">×</button>
        </div>
        <form 
          className="p-8 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(formData);
          }}
        >
          <div className="max-h-[60vh] overflow-y-auto px-1 space-y-5 custom-scrollbar">
            {currentFields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {field.label}
                </label>
                {field.type === 'select' ? (
                  <select
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                    value={formData[field.key] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  >
                    <option value="">Select Option</option>
                    {field.options?.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none transition-all"
                    value={formData[field.key] || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value });
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="pt-6 flex gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all uppercase tracking-widest"
            >
              Discard
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 uppercase tracking-widest"
            >
              Commit Data
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// --- Views ---

function DashboardView({ data, setActiveView, onEdit, onDelete, isAdmin, user, onSync }: { data: any; setActiveView: (view: View) => void; onEdit: (item: any) => void; onDelete: (id: string, mod: string) => void; isAdmin: boolean; user: any; onSync: () => void }) {
  const stats = data.stats || { totalTasks: 0, completed: 0, pending: 0, charts: {} };
  
  const totalRevenue = data.payments.filter((p: any) => p.status === 'success' && p.payment_type === 'client_to_admin').reduce((acc: number, p: any) => acc + p.amount, 0);
  const pendingRevenue = data.jobs.reduce((acc: number, j: any) => acc + (j.status !== 'Paid' ? (j.amount || 0) : 0), 0);
  
  const isElectrician = user.role === 'Electrician';
  const isClient = user.role === 'Client';

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
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900">System Command Center</h2>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-1">Real-time Enterprise monitoring active</p>
        </div>
        <button 
          onClick={onSync}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
        >
          <RefreshCw className="w-4 h-4 text-blue-600" />
          Sync Data
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label={isAdmin ? "Total Revenue" : isClient ? "System Health" : "My Earnings"} 
          value={isAdmin ? `₹${totalRevenue}` : isClient ? 'SECURE' : `₹${data.payments.filter((p:any) => p.receiver_id === data.electricians.find((e:any) => e.userId === user.id)?.id).reduce((acc:any, p:any) => acc + p.amount, 0)}`} 
          change={isAdmin ? `Pending: ₹${pendingRevenue}` : "Level 4 Protected"} 
          color="text-green-600" 
          icon={isAdmin ? TrendingUp : ShieldCheck}
          onClick={isAdmin ? () => setActiveView('payments') : undefined}
        />
        <StatCard 
          label="Active Electricians" 
          value={data.electricians.filter((e:any) => e.availability === 'Busy').length} 
          change={`Out of ${data.electricians.length} total`} 
          icon={UserIcon}
          onClick={isAdmin ? () => setActiveView('electricians') : undefined}
        />
        <StatCard 
          label="Total System Tasks" 
          value={isAdmin ? stats.totalTasks : data.tasks.length} 
          change={isAdmin ? `Completed: ${stats.completed}` : `Assigned: ${data.tasks.filter((t:any) => !t.completed).length}`} 
          color="text-blue-600" 
          icon={CheckSquare}
          onClick={() => setActiveView('tasks')}
        />
        <StatCard 
          label="Open Job Depth" 
          value={data.jobs.length} 
          change="Updated live" 
          color="text-amber-600" 
          icon={Briefcase}
          onClick={() => setActiveView('jobs')}
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
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState('Client');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      const email = (e.target as any).email.value;
      const password = (e.target as any).password.value;
      const name = (e.target as any).name.value;
      
      try {
        const res = await api.post('/api/auth/register', { email, password, name, role });
        if (res.success) {
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          window.location.reload();
        } else {
          toast.error(res.message);
        }
      } catch (err) {
        toast.error('Registration failed');
      }
    } else {
      onLogin(e);
    }
  };

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
        <div className="bg-white rounded-[2rem] p-8 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <ShieldCheck className="w-32 h-32" />
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900 text-center mb-1">VoltManager Pro</h1>
          <p className="text-slate-400 text-[10px] text-center mb-8 uppercase font-bold tracking-[0.2em]">Enterprise Contractor Portal</p>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">Full Legal Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input 
                    name="name"
                    type="text" 
                    placeholder="John Doe"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">Email System Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  name="email"
                  type="email" 
                  placeholder="name@company.com"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
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

            {isRegister && (
              <div className="space-y-1.5">
                 <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">Account Role</label>
                 <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button"
                      onClick={() => setRole('Client')}
                      className={cn(
                        "py-2.5 rounded-xl text-xs font-bold border transition-all uppercase tracking-widest",
                        role === 'Client' ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20" : "bg-slate-50 text-slate-400 border-slate-100"
                      )}
                    >
                      Client
                    </button>
                    <button 
                      type="button"
                      onClick={() => setRole('Electrician')}
                      className={cn(
                        "py-2.5 rounded-xl text-xs font-bold border transition-all uppercase tracking-widest",
                        role === 'Electrician' ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20" : "bg-slate-50 text-slate-400 border-slate-100"
                      )}
                    >
                      Electrician
                    </button>
                 </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 text-red-500 text-[10px] font-bold rounded-lg flex items-center gap-2 animate-pulse uppercase tracking-widest">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  {isRegister ? 'Register Identity' : 'Authenticate Access'}
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <button 
              onClick={() => setIsRegister(!isRegister)}
              className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-widest"
            >
              {isRegister ? 'Already have an account? Login' : 'Need enterprise access? Register'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({ label, value, change, color = 'text-slate-400', icon: Icon, onClick }: { label: string; value: any; change: string; color?: string; icon: any; onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group text-left transition-all",
        onClick && "hover:border-blue-300 hover:shadow-md cursor-pointer active:scale-[0.98]"
      )}
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-16 h-16" />
      </div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <div className="flex items-baseline gap-2 mt-3">
        <span className="text-3xl font-bold text-slate-900 tracking-tight">{value}</span>
      </div>
      <p className={cn("text-[11px] mt-2 font-bold uppercase italic tracking-tighter opacity-70", color)}>{change}</p>
    </button>
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

function JobsView({ items, onEdit, onDelete, electricians }: { items: Job[]; onEdit: (item: any) => void; onDelete: (id: string, mod: string) => void; electricians: Electrician[] }) {
  return (
    <DataTable 
      headers={['Title', 'Location', 'Status', 'Assigned To', 'Actions']}
      items={items}
      renderRow={(item) => {
        const elec = electricians.find(e => e.id === item.assignedTo);
        return (
          <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
            <td className="px-6 py-4 text-sm font-bold text-slate-900">{item.title}</td>
            <td className="px-6 py-4 text-sm text-slate-600 font-medium">{item.location}</td>
            <td className="px-6 py-4">
               <span className={cn(
                 "px-2 py-1 text-[10px] font-bold rounded-md uppercase tracking-widest",
                 item.status === 'Completed' ? 'bg-blue-100 text-blue-700' : 
                 item.status === 'Paid' ? 'bg-green-100 text-green-700' :
                 item.status === 'In Progress' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
               )}>
                {item.status}
              </span>
            </td>
            <td className="px-6 py-4 text-sm text-slate-500 italic font-medium">{elec ? elec.name : 'Unassigned'}</td>
            <td className="px-6 py-4">
              <TableActions onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id, 'jobs')} />
            </td>
          </tr>
        );
      }}
    />
  );
}

function TasksView({ items, data, onEdit, onDelete, filter, setFilter, isAdmin, user, fetchData }: { items: Task[]; data: any; onEdit: (item: any) => void; onDelete: (id: string, mod: string) => void; filter: string; setFilter: (f: string) => void; isAdmin: boolean; user: any; fetchData: () => void }) {
  const toggleStatus = async (item: Task) => {
    try {
      const res = await api.put(`/api/tasks/${item.id}`, { ...item, completed: !item.completed });
      if (res.success) {
        toast.success(item.completed ? 'Task reopened' : 'Task completed');
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to update status');
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
        headers={['Description', 'Priority', 'Job', 'Assignee', 'Status', 'Actions']}
        items={items}
        renderRow={(item) => {
          const job = data.jobs.find((j:any) => j.id === item.jobId);
          const elec = data.electricians.find((e:any) => e.id === item.electricianId);
          return (
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
              <td className="px-6 py-4 text-[11px] text-slate-500 font-bold uppercase tracking-tighter truncate max-w-[150px]">{job ? job.title : 'No Job'}</td>
              <td className="px-6 py-4 text-[11px] font-bold text-slate-600">{elec ? elec.name : 'Unassigned'}</td>
              <td className="px-6 py-4">
                 <button 
                  onClick={() => toggleStatus(item)}
                  className={cn(
                    "px-2 py-1 text-[10px] font-bold rounded-md uppercase tracking-widest transition-all",
                    item.completed ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400 hover:bg-blue-50 hover:text-blue-600'
                  )}
                 >
                  {item.completed ? 'Completed' : 'Mark Done'}
                </button>
              </td>
              <td className="px-6 py-4">
                {isAdmin && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <TableActions onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id, 'tasks')} />
                  </div>
                )}
              </td>
            </tr>
          );
        }}
      />
    </div>
  );
}

function ReportsView({ data, onRefresh, isAdmin, user }: { data: any; onRefresh: () => void; isAdmin: boolean; user: any }) {
  const [subView, setSubView] = useState<'meta' | 'daily' | 'completion' | 'electrician'>('meta');
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleReportUpload = async (file: File, category: 'meta' | 'daily' | 'completion' | 'electrician') => {
    if (!isAdmin) {
      toast.error('Only admins can add reports.');
      return;
    }

    setUploading(true);
    try {
      const uploadRes = await api.upload('/api/upload/report', file, 'report', { category });
      if (uploadRes.success) {
        toast.success('Report added successfully');
        onRefresh();
      } else {
        toast.error(uploadRes.message || 'Upload failed');
      }
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      setIsDragging(false);
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>, category: 'meta' | 'daily' | 'completion' | 'electrician') => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      await handleReportUpload(file, category);
    }
  };

  const uploadedReports = data.reports || [];

  const renderUploadZone = (category: 'meta' | 'daily' | 'completion' | 'electrician', title: string, description: string) => {
    const categoryReports = uploadedReports.filter((report: any) => (report.category || 'meta') === category);

    return (
      <div className="space-y-4">
        <div
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(event) => void handleDrop(event, category)}
          className={cn(
            "rounded-3xl border-2 border-dashed p-6 transition-all bg-white/70",
            isDragging ? "border-blue-500 bg-blue-50 shadow-lg" : "border-slate-200 hover:border-blue-300"
          )}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Add Report</p>
              <h3 className="text-lg font-bold text-slate-900 mt-1">{title}</h3>
              <p className="text-sm text-slate-500 mt-1">{description}</p>
            </div>
            <label className={cn(
              "inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer",
              uploading ? "bg-slate-100 text-slate-400" : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20"
            )}>
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Choose File'}
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                disabled={uploading}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void handleReportUpload(file, category);
                  }
                }}
              />
            </label>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Uploaded Items</p>
              <h4 className="text-sm font-bold text-slate-900">{categoryReports.length} file{categoryReports.length === 1 ? '' : 's'}</h4>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{category}</span>
          </div>
          {categoryReports.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">
              No uploaded reports yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {categoryReports.map((report: any) => (
                <div key={report.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{report.title}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">
                      {report.author} · {report.date}
                    </p>
                  </div>
                  {report.filePath ? (
                    <a
                      href={report.filePath}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:underline"
                    >
                      Open
                    </a>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Archived</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

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
                   <button 
                    onClick={() => toast.success(`Downloading: ${item.title}.pdf`)}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors uppercase tracking-widest"
                   >
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
      {isAdmin && renderUploadZone(subView, subView === 'meta' ? 'Drag and drop a PDF, PNG, or JPG here' : `Add ${subView} report`, subView === 'meta' ? 'Dropped files become archived reports immediately.' : `Dropped files will be attached to the ${subView} section.`)}
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

function ClientsView({ items, onEdit, onDelete }: { items: Client[]; onEdit: (item: any) => void; onDelete: (id: string, mod: string) => void }) {
  return (
    <DataTable 
      headers={['Name', 'Company', 'Phone', 'Actions']}
      items={items}
      renderRow={(item) => (
        <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors group">
          <td className="px-6 py-4 text-sm font-medium text-slate-900">{item.name}</td>
          <td className="px-6 py-4 text-sm text-slate-600">{item.company}</td>
          <td className="px-6 py-4 text-sm text-slate-500 font-mono tracking-tighter">{item.phone}</td>
          <td className="px-6 py-4">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <TableActions onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id, 'clients')} />
            </div>
          </td>
        </tr>
      )}
    />
  );
}

function PaymentsView({ items, data, fetchData, user }: { items: Payment[]; data: any; fetchData: () => void; user: any }) {
  const [processing, setProcessing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentPaymentJob, setCurrentPaymentJob] = useState<any>(null);
  const [currentPaymentType, setCurrentPaymentType] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking' | 'wallet'>('card');
  const [payerDetails, setPayerDetails] = useState({
    cardholderName: '',
    email: '',
    phone: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    address: '',
    upiId: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    walletProvider: '',
  });
  const [successPaymentData, setSuccessPaymentData] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState(() => {
    const firstJob = data.jobs[0];
    const payerName = user.role === 'Client' ? (data.clients.find((c: any) => c.userId === user.id)?.name || user.name) : user.name;

    return {
      job_title: firstJob?.title || '',
      amount: firstJob?.amount ? String(firstJob.amount) : '',
      type: user.role === 'Admin' ? 'admin_to_electrician' : 'client_to_admin',
      payer_name: payerName,
      receiver_id: user.role === 'Admin' ? (firstJob?.assignedTo || data.electricians[0]?.id || '') : 'admin',
      receiver_name: user.role === 'Admin' ? (data.electricians.find((e: Electrician) => e.id === firstJob?.assignedTo)?.name || '') : 'admin',
      payment_id: '',
    };
  });

  const buildPaymentDefaults = () => {
    const firstJob = data.jobs[0];
    const payerName = user.role === 'Client' ? (data.clients.find((c: any) => c.userId === user.id)?.name || user.name) : user.name;

    return {
      job_title: firstJob?.title || '',
      amount: firstJob?.amount ? String(firstJob.amount) : '',
      type: user.role === 'Admin' ? 'admin_to_electrician' : 'client_to_admin',
      payer_name: payerName,
      receiver_id: user.role === 'Admin' ? (firstJob?.assignedTo || data.electricians[0]?.id || '') : 'admin',
      receiver_name: user.role === 'Admin' ? (data.electricians.find((e: Electrician) => e.id === firstJob?.assignedTo)?.name || '') : 'admin',
      payment_id: '',
    };
  };

  const handlePaymentFieldChange = (field: string, value: string) => {
    setPaymentForm(prev => {
      const next = { ...prev, [field]: value };

      if (field === 'job_title') {
        const matchedJob = data.jobs.find((entry: Job) => entry.title.toLowerCase() === value.toLowerCase());
        if (matchedJob) {
          if (!prev.amount) {
            next.amount = matchedJob.amount ? String(matchedJob.amount) : '';
          }
          if (user.role === 'Admin' && next.type === 'admin_to_electrician') {
            next.receiver_id = matchedJob.assignedTo || data.electricians[0]?.id || '';
            next.receiver_name = data.electricians.find((entry: Electrician) => entry.id === next.receiver_id)?.name || '';
          }
        }
      }

      if (field === 'type') {
        next.receiver_id = value === 'admin_to_electrician'
          ? (data.jobs.find((entry: Job) => entry.title === prev.job_title)?.assignedTo || data.electricians[0]?.id || '')
          : 'admin';
        next.receiver_name = value === 'admin_to_electrician'
          ? (data.electricians.find((entry: Electrician) => entry.id === next.receiver_id)?.name || '')
          : 'admin';
      }

      if (field === 'receiver_id') {
        next.receiver_name = data.electricians.find((entry: Electrician) => entry.id === value)?.name || value;
      }

      return next;
    });
  };

  const handleAddPayment = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!paymentForm.job_title || !paymentForm.amount || !paymentForm.payer_name || !paymentForm.receiver_id) {
      toast.error('Please complete the payment details first.');
      return;
    }

    const existingJob = data.jobs.find((entry: Job) => entry.title.toLowerCase() === paymentForm.job_title.toLowerCase());
    const jobId = existingJob?.id || `job_${Date.now()}`;

    setProcessing(true);
    try {
      const verifyRes = await api.post('/api/payments/verify', {
        order_id: paymentForm.payment_id || `manual_${Date.now()}`,
        payment_id: paymentForm.payment_id || `pay_${Date.now()}`,
        amount: Number(paymentForm.amount),
        job_id: jobId,
        job_title: paymentForm.job_title,
        type: paymentForm.type,
        payer_id: user.role === 'Client' ? (data.clients.find((c: any) => c.userId === user.id)?.id || user.id) : 'admin',
        payer_name: paymentForm.payer_name,
        receiver_id: paymentForm.receiver_id,
        receiver_name: paymentForm.receiver_name,
      });

      if (verifyRes.success) {
        toast.success('Payment details added successfully!');
        setPaymentForm(buildPaymentDefaults());
        setShowAddForm(false);
        fetchData();
      } else {
        toast.error(verifyRes.message || 'Unable to add payment details.');
      }
    } catch (err) {
      toast.error('Payment gateway error');
    } finally {
      setProcessing(false);
    }
  };

  const handleMakePayment = (jobOrPayment: any, type?: string) => {
    // Handle both Job objects and Payment objects
    const isPaymentObject = jobOrPayment.job_title !== undefined;
    
    if (isPaymentObject) {
      // It's a payment object
      setCurrentPaymentJob({
        id: jobOrPayment.job_id || `job_${Date.now()}`,
        title: jobOrPayment.job_title,
        amount: jobOrPayment.amount,
        location: '',
        status: 'Pending',
        assignedTo: jobOrPayment.receiver_id,
        deadline: new Date().toISOString(),
        clientId: jobOrPayment.payer_id || 'admin'
      });
      setCurrentPaymentType(jobOrPayment.payment_type);
    } else {
      // It's a job object
      setCurrentPaymentJob(jobOrPayment);
      setCurrentPaymentType(type || 'admin_to_electrician');
    }
    
    setPaymentMethod('card');
    setPayerDetails({
      cardholderName: '',
      email: '',
      phone: '',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      address: '',
      upiId: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      walletProvider: '',
    });
    setShowPaymentModal(true);
  };

  const validatePayerDetails = () => {
    if (!payerDetails.cardholderName.trim()) {
      toast.error('Name is required');
      return false;
    }
    if (!payerDetails.email.includes('@')) {
      toast.error('Valid email is required');
      return false;
    }
    if (!/^\d{10}$/.test(payerDetails.phone.replace(/\D/g, ''))) {
      toast.error('Valid 10-digit phone number is required');
      return false;
    }

    if (paymentMethod === 'card') {
      if (!/^\d{13,19}$/.test(payerDetails.cardNumber.replace(/\s/g, ''))) {
        toast.error('Valid card number (13-19 digits) is required');
        return false;
      }
      if (!/^\d{2}\/\d{2}$/.test(payerDetails.expiryDate)) {
        toast.error('Expiry date must be in MM/YY format');
        return false;
      }
      if (!/^\d{3,4}$/.test(payerDetails.cvv)) {
        toast.error('Valid CVV (3-4 digits) is required');
        return false;
      }
      if (!payerDetails.address.trim()) {
        toast.error('Billing address is required');
        return false;
      }
    } else if (paymentMethod === 'upi') {
      if (!payerDetails.upiId.trim() || !payerDetails.upiId.includes('@')) {
        toast.error('Valid UPI ID required (e.g., yourname@upi)');
        return false;
      }
    } else if (paymentMethod === 'netbanking') {
      if (!payerDetails.bankName.trim()) {
        toast.error('Bank name is required');
        return false;
      }
      if (!payerDetails.accountNumber.trim() || payerDetails.accountNumber.length < 9) {
        toast.error('Valid account number is required');
        return false;
      }
      if (!payerDetails.ifscCode.trim() || payerDetails.ifscCode.length !== 11) {
        toast.error('Valid IFSC code (11 characters) is required');
        return false;
      }
    } else if (paymentMethod === 'wallet') {
      if (!payerDetails.walletProvider.trim()) {
        toast.error('Wallet provider is required');
        return false;
      }
    }
    return true;
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePayerDetails()) return;

    setProcessing(true);
    try {
      const amount = currentPaymentJob.amount || 500;
      // Step 1: Create Order
      const orderRes = await api.post('/api/payments/order', { amount, job_id: currentPaymentJob.id, type: currentPaymentType });
      
      if (orderRes.success) {
        // Step 2: Verify (Mocking successful verify after a short delay)
        setTimeout(async () => {
          const payerName = user.role === 'Client' ? (data.clients.find((c:any) => c.userId === user.id)?.name || user.name) : user.name;
          const receiverName = currentPaymentType === 'admin_to_electrician' ? (data.electricians.find((e: Electrician) => e.id === currentPaymentJob.assignedTo)?.name || currentPaymentJob.assignedTo) : 'admin';
          const verifyRes = await api.post('/api/payments/verify', {
            order_id: orderRes.data.id,
            amount,
            job_id: currentPaymentJob.id,
            job_title: currentPaymentJob.title,
            type: currentPaymentType,
            payer_id: user.role === 'Client' ? data.clients.find((c:any) => c.userId === user.id)?.id : 'admin',
            payer_name: payerName,
            receiver_id: currentPaymentType === 'admin_to_electrician' ? currentPaymentJob.assignedTo : 'admin',
            receiver_name: receiverName
          });
          
          if (verifyRes.success) {
            setSuccessPaymentData({
              transactionId: verifyRes.data.id,
              amount,
              jobTitle: currentPaymentJob.title,
              cardholderName: payerDetails.cardholderName,
              cardLast4: payerDetails.cardNumber.slice(-4),
              timestamp: new Date(),
              status: 'success'
            });
            setShowPaymentModal(false);
            setShowSuccessModal(true);
            fetchData();
          } else {
            toast.error('Payment verification failed');
          }
          setProcessing(false);
        }, 2000);
      } else {
        toast.error('Order creation failed');
        setProcessing(false);
      }
    } catch (err) {
      toast.error('Payment gateway error');
      setProcessing(false);
    }
  };

  const isAdmin = user.role === 'Admin';
  const isClient = user.role === 'Client';

  return (
    <div className="space-y-6 flex flex-col h-full">
      <AnimatePresence>
        {showPaymentModal && currentPaymentJob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => !processing && setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-slate-50 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Secure Payment</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Enter your payment details</p>
                </div>
                <button 
                  onClick={() => setShowPaymentModal(false)} 
                  disabled={processing}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-all font-bold text-xl disabled:opacity-50"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleProcessPayment} className="p-8 space-y-6 max-h-[calc(100vh-280px)] overflow-y-auto">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Job Details</p>
                      <p className="text-lg font-bold text-slate-800">{currentPaymentJob.title}</p>
                      <p className="text-sm text-slate-600 mt-1">₹{currentPaymentJob.amount || 500}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Payment Type</p>
                      <p className="text-sm font-bold text-slate-800">{(currentPaymentType || 'admin_to_electrician').replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 mt-6">
                  {/* Payment Method Selector */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { id: "upi", icon: "??", label: "UPI" },
                      { id: "card", icon: "??", label: "Card" },
                      { id: "netbanking", icon: "??", label: "Net Banking" },
                      { id: "wallet", icon: "??", label: "Wallet" }
                    ].map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                          paymentMethod === method.id 
                            ? "border-blue-600 bg-blue-50 text-blue-700" 
                            : "border-slate-100 hover:border-slate-200 text-slate-600"
                        }`}
                      >
                        <span className="text-xl">{method.icon}</span>
                        <span className="text-xs font-semibold">{method.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Common Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase">Full Name</label>
                      <input 
                        required
                        type="text"
                        value={payerDetails.cardholderName}
                        onChange={(e) => setPayerDetails({ ...payerDetails, cardholderName: e.target.value })}
                        placeholder="Enter your full name"
                        className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase">Email Address</label>
                      <input 
                        required
                        type="email"
                        value={payerDetails.email}
                        onChange={(e) => setPayerDetails({ ...payerDetails, email: e.target.value })}
                        placeholder="email@example.com"
                        className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold text-slate-700 uppercase">Phone Number</label>
                      <input 
                        required
                        type="tel"
                        value={payerDetails.phone}
                        onChange={(e) => setPayerDetails({ ...payerDetails, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                        placeholder="+91 9876543210"
                        className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>

                  {/* Method Specific Fields */}
                  <div className="pt-4 border-t border-slate-100">
                    {paymentMethod === "card" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700 uppercase">Card Number</label>
                          <input required type="text" value={payerDetails.cardNumber} onChange={(e) => { const val = e.target.value.replace(/\s/g, '').slice(0, 19); const formatted = val.match(/.{1,4}/g)?.join(' ') || val; setPayerDetails({ ...payerDetails, cardNumber: formatted }); }} placeholder="0000 0000 0000 0000" className="w-full p-3 rounded-lg border border-slate-200" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2"><label className="text-xs font-bold text-slate-700 uppercase">Expiry</label><input required type="text" value={payerDetails.expiryDate} onChange={(e) => { const val = e.target.value.replace(/\D/g, '').slice(0, 4); setPayerDetails({ ...payerDetails, expiryDate: val.length >= 2 ? `${val.slice(0, 2)}/${val.slice(2, 4)}` : val }); }} placeholder="MM/YY" className="w-full p-3 rounded-lg border border-slate-200" /></div>
                          <div className="space-y-2"><label className="text-xs font-bold text-slate-700 uppercase">CVV</label><input required type="password" value={payerDetails.cvv} onChange={(e) => setPayerDetails({ ...payerDetails, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })} placeholder="***" className="w-full p-3 rounded-lg border border-slate-200" /></div>
                        </div>
                        <div className="space-y-2"><label className="text-xs font-bold text-slate-700 uppercase">Billing Address</label><input required type="text" value={payerDetails.address} onChange={(e) => setPayerDetails({ ...payerDetails, address: e.target.value })} placeholder="Enter address" className="w-full p-3 rounded-lg border border-slate-200" /></div>
                      </div>
                    )}

                    {paymentMethod === "upi" && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase">UPI ID</label>
                        <input required type="text" value={payerDetails.upiId} onChange={(e) => setPayerDetails({ ...payerDetails, upiId: e.target.value })} placeholder="username@upi" className="w-full p-3 rounded-lg border border-slate-200" />
                      </div>
                    )}

                    {paymentMethod === "netbanking" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700 uppercase">Bank Name</label>
                          <select value={payerDetails.bankName} onChange={(e) => setPayerDetails({ ...payerDetails, bankName: e.target.value })} className="w-full p-3 rounded-lg border border-slate-200"><option>Select Bank</option><option>HDFC Bank</option><option>SBI</option><option>ICICI Bank</option></select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2"><label className="text-xs font-bold text-slate-700 uppercase">Account Number</label><input required type="text" value={payerDetails.accountNumber} onChange={(e) => setPayerDetails({ ...payerDetails, accountNumber: e.target.value })} className="w-full p-3 rounded-lg border border-slate-200" /></div>
                          <div className="space-y-2"><label className="text-xs font-bold text-slate-700 uppercase">IFSC Code</label><input required type="text" value={payerDetails.ifscCode} onChange={(e) => setPayerDetails({ ...payerDetails, ifscCode: e.target.value.toUpperCase() })} className="w-full p-3 rounded-lg border border-slate-200" /></div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === "wallet" && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase">Select Wallet</label>
                        <select value={payerDetails.walletProvider} onChange={(e) => setPayerDetails({ ...payerDetails, walletProvider: e.target.value })} className="w-full p-3 rounded-lg border border-slate-200"><option value="">Choose wallet</option><option>Google Pay</option><option>WhatsApp Pay</option><option>Paytm</option><option>PhonePe</option><option>Amazon Pay</option></select>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(false)}
                      className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={processing}
                      className="px-8 py-2.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center gap-2"
                    >
                      {processing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <span>Pay ₹{currentPaymentJob?.amount || 500} Now</span>
                      )}
                    </button>
                  </div>
                </div>

              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccessModal && successPaymentData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setShowSuccessModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 30 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-12 text-center bg-gradient-to-b from-green-50 to-white space-y-6">
                <div className="flex justify-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 120 }}
                    className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center"
                  >
                    <div className="text-3xl">✓</div>
                  </motion.div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Payment Successful!</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Transaction Completed</p>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 text-left">
                  <div className="flex justify-between items-center py-2 border-b border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Transaction ID</span>
                    <span className="font-mono text-sm font-bold text-slate-800">{successPaymentData.transactionId?.substring(0, 12)}...</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Job</span>
                    <span className="text-sm font-bold text-slate-800">{successPaymentData.jobTitle}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Amount</span>
                    <span className="text-lg font-bold text-green-600">₹{successPaymentData.amount}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Cardholder</span>
                    <span className="text-sm font-bold text-slate-800">{successPaymentData.cardholderName}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Card</span>
                    <span className="text-sm font-bold text-slate-800">•••• •••• •••• {successPaymentData.cardLast4}</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200">
                  <button
                    onClick={() => setShowSuccessModal(false)}
                    className="w-full px-6 py-3 rounded-xl bg-blue-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Payments</h3>
          <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Record and process payment activity</p>
        </div>
        <button
          onClick={() => {
            setPaymentForm(buildPaymentDefaults());
            setShowAddForm(prev => !prev);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {showAddForm ? 'Close Form' : 'Add Payment Details'}
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <CreditCard className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Add New Payment Details</h3>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Stored through the existing payment verification flow</p>
              </div>
            </div>

            <form onSubmit={handleAddPayment} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Job Title</span>
                <input
                  type="text"
                  value={paymentForm.job_title}
                  onChange={(e) => handlePaymentFieldChange('job_title', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type a new job title"
                />
              </label>

              <label className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Amount</span>
                <input
                  type="number"
                  min="1"
                  value={paymentForm.amount}
                  onChange={(e) => handlePaymentFieldChange('amount', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter amount"
                />
              </label>

              <label className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Payment Type</span>
                <select
                  value={paymentForm.type}
                  onChange={(e) => handlePaymentFieldChange('type', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="client_to_admin">Client to Admin</option>
                  <option value="admin_to_electrician">Admin to Electrician</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Gateway Payment ID</span>
                <input
                  type="text"
                  value={paymentForm.payment_id}
                  onChange={(e) => handlePaymentFieldChange('payment_id', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional reference ID"
                />
              </label>

              <label className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Payer Name</span>
                <input
                  type="text"
                  value={paymentForm.payer_name}
                  onChange={(e) => handlePaymentFieldChange('payer_name', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-sm text-slate-500"
                  placeholder="Who made the payment?"
                />
              </label>

              <label className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Receiver</span>
                {user.role === 'Admin' ? (
                  <select
                    value={paymentForm.receiver_id}
                    onChange={(e) => handlePaymentFieldChange('receiver_id', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select electrician</option>
                    {data.electricians.map((electrician: Electrician) => (
                      <option key={electrician.id} value={electrician.id}>
                        {electrician.name} ({electrician.level})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={paymentForm.receiver_name}
                    readOnly
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-sm text-slate-500"
                  />
                )}
              </label>

              <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentForm(buildPaymentDefaults());
                    setShowAddForm(false);
                  }}
                  className="px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-5 py-3 rounded-xl bg-blue-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-blue-700 disabled:opacity-60 transition-all shadow-lg shadow-blue-500/20"
                >
                  {processing ? 'Saving...' : 'Save Payment Details'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Pending Actions</h3>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Awaiting clearing</p>
            </div>
          </div>
          <div className="space-y-3 max-h-80 overflow-auto">
            {/* Jobs pending payment */}
            {data.jobs.filter((j: any) => j.status !== 'Paid' && (isClient ? j.clientId === data.clients.find((c:any) => c.userId === user.id)?.id : true)).map((job: any) => (
              <div key={job.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between group hover:border-blue-200 transition-all">
                <div>
                  <p className="text-sm font-bold text-slate-800">{job.title}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-tighter">Amount: ₹{job.amount || 0}</p>
                </div>
                <button 
                  disabled={processing}
                  onClick={() => handleMakePayment(job, isClient ? 'client_to_admin' : 'admin_to_electrician')}
                  className="px-4 py-1.5 bg-blue-600 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {processing ? '...' : 'Pay Now'}
                </button>
              </div>
            ))}
            
            {/* Newly added payments ready to pay */}
            {data.payments.filter((p: any) => p.status !== 'success').map((payment: any) => (
              <div key={payment.id} className="p-4 bg-green-50 rounded-xl border border-green-100 flex items-center justify-between group hover:border-green-300 transition-all">
                <div>
                  <p className="text-sm font-bold text-slate-800">{payment.job_title}</p>
                  <p className="text-[10px] text-green-600 font-bold uppercase mt-0.5 tracking-tighter">Amount: ₹{payment.amount}</p>
                </div>
                <button 
                  disabled={processing}
                  onClick={() => handleMakePayment(payment)}
                  className="px-4 py-1.5 bg-green-600 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-green-700 transition-all disabled:opacity-50"
                >
                  {processing ? '...' : 'Pay Now'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl flex flex-col justify-between text-white shadow-xl shadow-blue-900/20">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-blue-400 opacity-50" />
              <div>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Enterprise Wallet</p>
                <p className="text-2xl font-bold tracking-tight">VoltManager Secure</p>
              </div>
            </div>
            <div className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md">
              Level 4 Auth
            </div>
          </div>
          <div className="mt-8">
            <p className="text-[10px] font-bold text-blue-400/60 uppercase tracking-widest mb-1">Global Liquidity</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tighter">₹{data.payments.reduce((acc:any, p:any) => acc + p.amount, 0)}</span>
              <span className="text-[10px] font-bold uppercase text-green-400">Total Processed</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <DataTable 
          headers={['Transaction ID', 'Job', 'Payer', 'Type', 'Amount', 'Status', 'Date']}
          items={items}
          renderRow={(item) => (
            <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50/50 text-sm">
              <td className="px-6 py-4 font-mono text-[11px] text-slate-500">#{item.id.substring(0, 8)}</td>
              <td className="px-6 py-4 font-bold text-slate-800">{item.job_title || data.jobs.find((job: Job) => job.id === item.job_id)?.title || item.job_id}</td>
              <td className="px-6 py-4 text-slate-600">{item.payer_name || item.payer_id}</td>
              <td className="px-6 py-4">
                <span className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                  item.payment_type === 'client_to_admin' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                )}>
                  {item.payment_type.replace(/_/g, ' ')}
                </span>
              </td>
              <td className="px-6 py-4 font-bold text-slate-800">₹{item.amount}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{item.status}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-slate-400 text-[11px] uppercase font-bold">{format(new Date(item.created_at), 'dd MMM, HH:mm')}</td>
            </tr>
          )}
        />
      </div>
    </div>
  );
}

function DataTable({ headers, items, renderRow }: { headers: string[]; items: any[]; renderRow: (item: any, idx: number) => ReactNode }) {
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


