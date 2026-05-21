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
  DollarSign,
  Smartphone,
  Wallet,
  Building2,
  Menu
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  onSnapshot,
  orderBy,
  Timestamp,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db, auth as firebaseAuth } from './lib/firebase';
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
const handleResponse = async (res: Response) => {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : { success: res.ok };
  } catch (err) {
    if (!res.ok) throw new Error(`Status ${res.status}: ${text || 'Unknown error'}`);
    return { success: true, data: text };
  }
};

const api = {
  get: (url: string) => fetch(url, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  }).then(handleResponse),
  
  post: (url: string, data: any) => fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(data),
  }).then(handleResponse),

  put: (url: string, data: any) => fetch(url, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(data),
  }).then(handleResponse),

  delete: (url: string) => fetch(url, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  }),

  upload: (url: string, file: File, fieldName: string) => {
    const formData = new FormData();
    formData.append(fieldName, file);
    return fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: formData
    }).then(handleResponse);
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
  receiver_id: string;
  job_id: string;
  amount: number;
  currency: string;
  payment_type: string;
  status: string;
  created_at: string;
  method: string;
  payer_name?: string;
  payer_phone?: string;
  transaction_note?: string;
  gateway_payment_id?: string;
}

interface AppNotification {
  id: number;
  message: string;
  timestamp: Date;
  read: boolean;
}

// --- Components ---

function TableActions({ onEdit, onDelete }: { onEdit: (e: React.MouseEvent) => void; onDelete: (e: React.MouseEvent) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={(e) => { e.stopPropagation(); onEdit(e); }} 
        className="p-1 hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors rounded"
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(e); }} 
        className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors rounded"
      >
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

const safeFormat = (dateStr: any, formatStr: string) => {
  try {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return format(date, formatStr);
  } catch (err) {
    return 'Invalid Date';
  }
};

export default function App() {
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('user') || 'null'));
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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

  // Validate token on app startup
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) return; // No token, skip validation

      try {
        const res = await fetch('/api/auth/validate', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(handleResponse);

        if (!res.success) {
          // Token is invalid or expired
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          toast.error('Session expired. Please login again.');
        }
      } catch (err) {
        // Network error or other issue, but don't log out the user
        console.warn('Token validation failed:', err);
      }
    };

    validateToken();
  }, []);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        getDocs(collection(db, 'electricians')),
        getDocs(collection(db, 'jobs')),
        getDocs(collection(db, 'tasks')),
        getDocs(collection(db, 'materials')),
        getDocs(collection(db, 'reports')),
        getDocs(collection(db, 'payments')),
        getDocs(collection(db, 'clients')),
        fetch('/api/dashboard/stats', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(handleResponse)
      ]);

      const [eSnap, jSnap, tSnap, mSnap, rSnap, pSnap, cSnap, statsRes] = results;

      setData({ 
        electricians: eSnap.status === 'fulfilled' ? (eSnap.value as any).docs.map((d: any) => ({ id: d.id, ...d.data() })) : [], 
        jobs: jSnap.status === 'fulfilled' ? (jSnap.value as any).docs.map((d: any) => ({ id: d.id, ...d.data() })) : [], 
        tasks: tSnap.status === 'fulfilled' ? (tSnap.value as any).docs.map((d: any) => ({ id: d.id, ...d.data() })) : [], 
        materials: mSnap.status === 'fulfilled' ? (mSnap.value as any).docs.map((d: any) => ({ id: d.id, ...d.data() })) : [], 
        reports: rSnap.status === 'fulfilled' ? (rSnap.value as any).docs.map((d: any) => ({ id: d.id, ...d.data() })) : [],
        payments: pSnap.status === 'fulfilled' ? (pSnap.value as any).docs.map((d: any) => ({ id: d.id, ...d.data() })) : [],
        clients: cSnap.status === 'fulfilled' ? (cSnap.value as any).docs.map((d: any) => ({ id: d.id, ...d.data() })) : [],
        stats: (statsRes.status === 'fulfilled' && (statsRes.value as any).success) ? (statsRes.value as any).data : {}
      });

      if (results.some(r => r.status === 'rejected')) {
        console.warn('Some data sources failed to load', results.filter(r => r.status === 'rejected'));
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
      toast.error('Sync error. Using cached data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Real-time synchronization
    const collections = ['electricians', 'jobs', 'tasks', 'materials', 'reports', 'payments', 'clients'];
    const unsubscribes = collections.map(colName => {
      return onSnapshot(collection(db, colName), (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setData(prev => ({
          ...prev,
          [colName]: items
        }));
      });
    });

    socketRef.current = io();
    socketRef.current.on('notification', (notif: any) => {
      setNotifications(prev => [{ ...notif, read: false }, ...prev].slice(0, 50));
      toast(notif.message, {
        icon: '🔔',
        style: {
          borderRadius: '12px',
          background: '#0f172a',
          color: '#fff',
          fontSize: '11px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }
      });
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
      socketRef.current?.disconnect();
    };
  }, [user]);

  useEffect(() => {
    // Only manual fetch for things not in snapshots or for stats
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
      }).then(handleResponse);

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

  const handleDelete = async (id: string, collectionName: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/${collectionName}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast.success('Deleted successfully');
        fetchData();
      } else {
        const error = await handleResponse(res);
        throw new Error(error.message || 'Delete failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Delete error: Check your permissions');
    }
  };

  const handleSubmit = async (formData: any) => {
    const isEdit = !!editingItem;
    const collectionName = activeView as string;
    const token = localStorage.getItem('token');
    
    try {
      const url = isEdit ? `/api/${collectionName}/${editingItem.id}` : `/api/${collectionName}`;
      const method = isEdit ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      }).then(handleResponse);

      if (res.success) {
        toast.success(`${collectionName.charAt(0).toUpperCase() + collectionName.slice(1)} ${isEdit ? 'updated' : 'created'} successfully`);
        setIsModalOpen(false);
        fetchData();
      } else {
        throw new Error(res.message || 'Submission failed');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Submission failed. Check your permissions.');
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
        return <ElectriciansView items={filteredData('electricians')} onEdit={handleEdit} onDelete={handleDelete} filter={electricianFilter} setFilter={setElectricianFilter} isAdmin={isAdmin} />;
      case 'jobs':
        return <JobsView items={filteredData('jobs')} onEdit={handleEdit} onDelete={handleDelete} electricians={data.electricians} isAdmin={isAdmin} />;
      case 'tasks':
        return <TasksView items={filteredData('tasks')} data={data} onEdit={handleEdit} onDelete={handleDelete} filter={taskFilter} setFilter={setTaskFilter} isAdmin={isAdmin} user={user} fetchData={fetchData} />;
      case 'reports':
        return <ReportsView data={{ ...data, reports: filteredData('reports') }} onDelete={handleDelete} isAdmin={isAdmin} />;
      case 'materials':
        return <MaterialsView items={filteredData('materials')} onEdit={handleEdit} onDelete={handleDelete} isAdmin={isAdmin} />;
      case 'payments':
        return <PaymentsView items={filteredData('payments')} data={data} fetchData={fetchData} user={user} isAdmin={isAdmin} onDelete={handleDelete} />;
      case 'clients':
        return <ClientsView items={filteredData('clients')} onEdit={handleEdit} onDelete={handleDelete} isAdmin={isAdmin} />;
      default:
        return <DashboardView data={data} setActiveView={setActiveView} onEdit={handleEdit} onDelete={handleDelete} isAdmin={isAdmin} user={user} onSync={fetchData} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden relative">
      <Toaster position="top-right" />
      {/* Sidebar Backdrop (mobile only) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 md:hidden z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      {/* Sidebar ... */}
      <aside className={cn(
        "w-64 bg-slate-900 flex flex-col shadow-2xl",
        "fixed md:static inset-0 md:inset-auto",
        "z-50 md:z-auto",
        "transition-transform duration-300",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
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
            onClick={() => { setActiveView('dashboard'); setIsSidebarOpen(false); }} 
          />
          {isAdmin && (
            <>
              <div className="px-4 py-2 mt-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-50">Management</div>
              <SidebarItem 
                icon={Users} 
                label="Electricians" 
                active={activeView === 'electricians'} 
                onClick={() => { setActiveView('electricians'); setIsSidebarOpen(false); }} 
              />
            </>
          )}
          <div className="px-4 py-2 mt-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-50">Operations</div>
          <SidebarItem 
            icon={Briefcase} 
            label="Jobs" 
            active={activeView === 'jobs'} 
            onClick={() => { setActiveView('jobs'); setIsSidebarOpen(false); }} 
          />
          <SidebarItem 
            icon={CheckSquare} 
            label="Tasks" 
            active={activeView === 'tasks'} 
            onClick={() => { setActiveView('tasks'); setIsSidebarOpen(false); }} 
          />
          <div className="px-4 py-2 mt-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-50">Finance</div>
          {isAdmin && (
            <SidebarItem 
              icon={Users} 
              label="Clients" 
              active={activeView === 'clients'} 
              onClick={() => { setActiveView('clients'); setIsSidebarOpen(false); }} 
            />
          )}
          <SidebarItem 
            icon={CreditCard} 
            label="Payments" 
            active={activeView === 'payments'} 
            onClick={() => { setActiveView('payments'); setIsSidebarOpen(false); }} 
          />
          <div className="px-4 py-2 mt-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-50">Resources</div>
          <SidebarItem 
            icon={Package} 
            label="Materials" 
            active={activeView === 'materials'} 
            onClick={() => { setActiveView('materials'); setIsSidebarOpen(false); }} 
          />
          <SidebarItem 
            icon={FileText} 
            label="Reports" 
            active={activeView === 'reports'} 
            onClick={() => { setActiveView('reports'); setIsSidebarOpen(false); }} 
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
      <main className="flex-1 overflow-auto flex flex-col w-full md:w-auto">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 shadow-sm shadow-slate-100">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
             <h1 className="text-lg font-bold text-slate-800 capitalize tracking-tight">
              {activeView === 'dashboard' ? 'Operations Overview' : activeView}
            </h1>
            {activeView !== 'dashboard' && isAdmin && (
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

            <button 
              onClick={fetchData}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-blue-600 transition-colors bg-slate-100 rounded-lg"
              title="Refresh Data"
            >
              <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
            </button>
            
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
                            <p className="text-[10px] text-slate-400 mt-2 uppercase font-bold tracking-widest">{safeFormat(n.timestamp, 'HH:mm:ss')}</p>
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
        { value: 'Pending', label: 'Scheduled' },
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
        { value: 'Normal', label: 'Medium' },
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
    payments: [
      { label: 'Job', type: 'select', key: 'job_id', options: data.jobs.map((j:any) => ({ value: j.id, label: j.title })) },
      { label: 'Amount', type: 'number', key: 'amount' },
      { label: 'Payment Type', type: 'select', key: 'payment_type', options: [
        { value: 'client_to_admin', label: 'Client to Admin' },
        { value: 'admin_to_electrician', label: 'Admin to Electrician' },
      ]},
      { label: 'Method', type: 'select', key: 'method', options: [
        { value: 'UPI', label: 'UPI' },
        { value: 'Card', label: 'Card' },
        { value: 'Netbanking', label: 'Netbanking' },
        { value: 'Wallet', label: 'Wallet' },
      ]},
      { label: 'Status', type: 'select', key: 'status', options: [
        { value: 'success', label: 'Success' },
        { value: 'pending', label: 'Pending' },
        { value: 'failed', label: 'Failed' },
      ]},
    ],
    reports: [
      { label: 'Title', type: 'text', key: 'title' },
      { label: 'Author', type: 'text', key: 'author' },
      { label: 'Date', type: 'date', key: 'date' },
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
          onClick={() => isAdmin ? setActiveView('payments') : undefined}
        />
        <StatCard 
          label="Active Electricians" 
          value={data.electricians.filter((e:any) => e.availability === 'Busy').length} 
          change={`Out of ${data.electricians.length} total`} 
          icon={UserIcon}
          onClick={() => isAdmin && setActiveView('electricians')}
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
                  <p className="text-[9px] text-slate-400 uppercase font-bold mt-1 tracking-widest">{safeFormat(f.timestamp, 'HH:mm')}</p>
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

function ElectriciansView({ items, onEdit, onDelete, filter, setFilter, isAdmin }: { items: Electrician[]; onEdit: (item: any) => void; onDelete: (id: string, mod: string) => void; filter: string; setFilter: (f: string) => void; isAdmin: boolean }) {
  return (
    <div className="space-y-4 flex flex-col h-full">
      <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 overflow-x-auto">
        <Filter className="w-4 h-4 text-slate-400 ml-2 flex-shrink-0" />
        {['All', 'Available', 'Busy'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all flex-shrink-0",
              filter === f ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:bg-slate-100"
            )}
          >
            {f}
          </button>
        ))}
      </div>
      
      {/* Desktop Table */}
      <div className="hidden md:block">
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
              <td className="py-4 px-6 text-right">
                {isAdmin && (
                  <div className="flex justify-end">
                    <TableActions onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id, 'electricians')} />
                  </div>
                )}
              </td>
            </tr>
          )}
        />
      </div>
      
      {/* Mobile Cards */}
      <div className="md:hidden">
        <CardGrid
          items={items}
          renderCard={(item) => (
            <ItemCard>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">{item.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 font-mono italic">{item.level}</p>
                </div>
                {isAdmin && <TableActions onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id, 'electricians')} />}
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <span className={cn(
                  "px-2 py-1 text-[10px] font-bold rounded-md uppercase",
                  item.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                )}>
                  {item.status}
                </span>
                <span className={cn(
                  "px-2 py-1 text-[10px] font-bold rounded-md uppercase",
                  item.availability === 'Available' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                )}>
                  {item.availability}
                </span>
              </div>
            </ItemCard>
          )}
        />
      </div>
    </div>
  );
}

function JobsView({ items, onEdit, onDelete, electricians, isAdmin }: { items: Job[]; onEdit: (item: any) => void; onDelete: (id: string, mod: string) => void; electricians: Electrician[]; isAdmin: boolean }) {
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block">
        <DataTable 
          headers={['Title', 'Location', 'Status', 'Assigned To', 'Actions']}
          items={items}
          renderRow={(item) => {
            const elec = electricians.find(e => e.id === item.assignedTo);
            return (
              <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors group">
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
                <td className="px-6 py-4 text-right">
                  {isAdmin && (
                    <div className="flex justify-end">
                      <TableActions onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id, 'jobs')} />
                    </div>
                  )}
                </td>
              </tr>
            );
          }}
        />
      </div>
      
      {/* Mobile Cards */}
      <div className="md:hidden">
        <CardGrid
          items={items}
          renderCard={(item) => {
            const elec = electricians.find(e => e.id === item.assignedTo);
            return (
              <ItemCard>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900">{item.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{item.location}</p>
                  </div>
                  {isAdmin && <TableActions onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id, 'jobs')} />}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className={cn(
                    "px-2 py-1 text-[10px] font-bold rounded-md uppercase tracking-widest",
                    item.status === 'Completed' ? 'bg-blue-100 text-blue-700' : 
                    item.status === 'Paid' ? 'bg-green-100 text-green-700' :
                    item.status === 'In Progress' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                  )}>
                    {item.status}
                  </span>
                  <span className="text-xs text-slate-500 italic">{elec ? elec.name : 'Unassigned'}</span>
                </div>
              </ItemCard>
            );
          }}
        />
      </div>
    </>
  );
}

function TasksView({ items, data, onEdit, onDelete, filter, setFilter, isAdmin, user, fetchData }: { items: Task[]; data: any; onEdit: (item: any) => void; onDelete: (id: string, mod: string) => void; filter: string; setFilter: (f: string) => void; isAdmin: boolean; user: any; fetchData: () => void }) {
  const toggleStatus = async (item: Task) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/tasks/${item.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ completed: !item.completed })
      }).then(handleResponse);

      if (res.success) {
        toast.success(item.completed ? 'Task reopened' : 'Task completed');
        fetchData();
      } else {
        throw new Error(res.message || 'Update failed');
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-4 flex flex-col h-full">
      <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 overflow-x-auto">
        <Filter className="w-4 h-4 text-slate-400 ml-2 flex-shrink-0" />
        {['All', 'Pending', 'Completed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all flex-shrink-0",
              filter === f ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:bg-slate-100"
            )}
          >
            {f}
          </button>
        ))}
      </div>
      
      {/* Desktop Table */}
      <div className="hidden md:block">
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
                <td className="px-6 py-4 text-right">
                  {isAdmin && (
                    <div className="flex justify-end">
                      <TableActions onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id, 'tasks')} />
                    </div>
                  )}
                </td>
              </tr>
            );
          }}
        />
      </div>
      
      {/* Mobile Cards */}
      <div className="md:hidden">
        <CardGrid
          items={items}
          renderCard={(item) => {
            const job = data.jobs.find((j:any) => j.id === item.jobId);
            const elec = data.electricians.find((e:any) => e.id === item.electricianId);
            return (
              <ItemCard>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 text-sm">{item.description}</h3>
                    <p className="text-xs text-slate-500 mt-1">{job ? job.title : 'No Job'}</p>
                  </div>
                  {isAdmin && <TableActions onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id, 'tasks')} />}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <span className={cn(
                    "text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                    item.priority === 'High' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
                  )}>
                    {item.priority}
                  </span>
                  <span className="text-xs text-slate-500 italic flex-1">{elec ? elec.name : 'Unassigned'}</span>
                  <button 
                    onClick={() => toggleStatus(item)}
                    className={cn(
                      "px-2 py-1 text-[10px] font-bold rounded-md uppercase tracking-widest transition-all flex-shrink-0",
                      item.completed ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
                    )}
                   >
                    {item.completed ? '✓' : '○'}
                  </button>
                </div>
              </ItemCard>
            );
          }}
        />
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, id }: { icon: any, title: string, id: string }) {
  return (
    <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
      <div className="flex items-center gap-4">
        <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 text-blue-600">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
            <Activity className="w-2.5 h-2.5" /> 
            Live Feed: {id}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden sm:block px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-bold text-slate-400 uppercase tracking-widest lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
          Drag Priority
        </div>
        <div className="w-8 h-8 flex items-center justify-center text-slate-300">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="4" cy="4" r="1" /><circle cx="4" cy="8" r="1" /><circle cx="4" cy="12" r="1" />
            <circle cx="8" cy="4" r="1" /><circle cx="8" cy="8" r="1" /><circle cx="8" cy="12" r="1" />
            <circle cx="12" cy="4" r="1" /><circle cx="12" cy="8" r="1" /><circle cx="12" cy="12" r="1" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function SectionImportZone({ sectionName }: { sectionName: string }) {
  const [isDragging, setIsDragging] = useState(false);
  const [queue, setQueue] = useState<{ name: string; id: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragging(true);
    else if (e.type === "dragleave") setIsDragging(false);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const filesArray = Array.from(files) as any[];
    setQueue(prev => [...filesArray.map(f => ({ name: f.name, id: Math.random().toString(36) })), ...prev]);
    
    // Universal Update: Create a report record for each dropped file
    for (const file of filesArray) {
      try {
        await addDoc(collection(db, 'reports'), {
          title: `Imported: ${file.name}`,
          author: 'System Auto-Import',
          date: new Date().toISOString().split('T')[0],
          section: sectionName,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.error('Auto-import failed', err);
      }
    }
    
    toast.success(`Importing ${filesArray.length} items to ${sectionName}. Information updated across the website.`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  return (
    <div 
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={cn(
        "m-4 p-4 border-2 border-dashed rounded-xl transition-all flex items-center justify-center gap-4 group/drop cursor-pointer",
        isDragging ? "border-blue-500 bg-blue-50/50" : "border-slate-100 hover:border-slate-200 hover:bg-slate-50/30"
      )}
    >
      <input 
        type="file" 
        multiple 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileInput}
      />
      <div className={cn("p-2 rounded-lg bg-white border border-slate-100 text-slate-300 group-hover/drop:text-blue-500 transition-colors", isDragging && "text-blue-600 scale-110")}>
        <Upload className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
          {isDragging ? "Release to process data..." : `Drop or click to browse ${sectionName} files`}
        </p>
        <p className="text-[9px] text-slate-300 uppercase tracking-tighter">PDF • CSV • XLSX (Max 10MB)</p>
      </div>
      {queue.length > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            {queue.length} Processing
          </span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setQueue([]);
            }} 
            className="p-1 hover:text-red-500 text-slate-300 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

function ReportsView({ data, onDelete, isAdmin }: { data: any; onDelete: (id: string, mod: string) => void; isAdmin: boolean }) {
  const [sections, setSections] = useState([
    { id: 'daily', label: 'Daily Work Logs', icon: Calendar },
    { id: 'completion', label: 'Completion Metrics', icon: BarChart3 },
    { id: 'electrician', label: 'Resource Activity', icon: Users },
    { id: 'meta', label: 'Archived General Reports', icon: FileText },
  ]);

  const [activeTab, setActiveTab] = useState('daily');

  const exportToCSV = (items: any[], filename: string) => {
    if (!items || !items.length) {
      toast.error('No data to export');
      return;
    }
    const headers = Object.keys(items[0]);
    const rows = items.map(obj => headers.map(header => JSON.stringify(obj[header])).join(','));
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.click();
    toast.success(`Exported ${filename}.csv`);
  };

  const reportDaily = React.useMemo(() => {
    const taskLogs = data.tasks.map((t: any) => {
      const elec = data.electricians.find((e: any) => e.id === t.electricianId);
      return {
        date: t.date || '2024-05-01',
        electricianName: elec ? elec.name : 'Unknown',
        taskName: t.description,
        status: t.completed ? 'Completed' : 'Pending',
        hoursWorked: t.hoursWorked || 0
      };
    });

    const jobLogs = data.jobs
      .filter(j => j.status === 'In Progress' || j.status === 'Completed' || j.status === 'Paid')
      .map(j => {
        const elec = data.electricians.find((e: any) => e.id === j.assignedTo);
        return {
          date: j.updated_at ? j.updated_at.split('T')[0] : (j.created_at ? j.created_at.split('T')[0] : '2024-05-01'),
          electricianName: elec ? elec.name : 'Unassigned',
          taskName: `[JOB] ${j.title}`,
          status: j.status,
          hoursWorked: 0
        };
      });

    const activityLogs = data.reports
      .filter((r: any) => r.type === 'Activity Log')
      .map((r: any) => ({
        date: r.date || '2024-05-01',
        electricianName: r.author || 'System',
        taskName: `${r.title}: ${r.details}`,
        status: 'Activity',
        hoursWorked: 0
      }));

    return [...taskLogs, ...jobLogs, ...activityLogs].sort((a, b) => b.date.localeCompare(a.date));
  }, [data.tasks, data.electricians, data.jobs, data.reports]);

  const reportCompletion = React.useMemo(() => {
    const total = data.tasks.length;
    const completed = data.tasks.filter((t: any) => t.completed).length;
    return {
      total,
      completed,
      pending: total - completed,
      rate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [data.tasks]);

  const reportElectrician = React.useMemo(() => {
    return data.electricians.map((e: any) => {
      const eTasks = data.tasks.filter((t: any) => t.electricianId === e.id);
      return {
        name: e.name,
        completed: eTasks.filter((t: any) => t.completed).length,
        pending: eTasks.filter((t: any) => !t.completed).length,
        lastActivity: 'Today'
      };
    });
  }, [data.electricians, data.tasks]);

  const renderSectionContent = (id: string) => {
    switch (id) {
      case 'daily':
        return (
          <div className="overflow-auto max-h-96 custom-scrollbar">
            <DataTable 
              headers={['Date', 'Electrician', 'Task', 'Status', 'Hours']}
              items={reportDaily}
              renderRow={(item, idx) => (
                <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50/50 text-xs">
                  <td className="px-4 py-3 font-mono">{item.date}</td>
                  <td className="px-4 py-3 font-medium">{item.electricianName}</td>
                  <td className="px-4 py-3">{item.taskName}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn("px-2 py-0.5 rounded text-[9px] font-bold uppercase", item.status === 'Completed' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-600')}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono italic text-right">{item.hoursWorked}h</td>
                </tr>
              )}
            />
          </div>
        );
      case 'completion':
        const c = reportCompletion;
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 flex flex-col justify-center items-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Load</p>
              <p className="text-4xl font-bold text-slate-900">{c.total}</p>
              <div className="mt-4 grid grid-cols-2 gap-4 w-full">
                <div className="text-center p-2 bg-blue-50/50 rounded-xl">
                  <p className="text-[9px] font-bold text-blue-400 uppercase">Synchronized</p>
                  <p className="text-sm font-bold text-blue-600">{c.completed}</p>
                </div>
                <div className="text-center p-2 bg-slate-50 rounded-xl">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Awaiting</p>
                  <p className="text-sm font-bold text-slate-600">{c.pending}</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col justify-center items-center text-white">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Completion Rate</p>
              <p className="text-5xl font-bold">{c.rate}%</p>
              <div className="w-full h-1.5 bg-white/10 rounded-full mt-6 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${c.rate}%` }} className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]" />
              </div>
            </div>
          </div>
        );
      case 'electrician':
        return (
          <div className="overflow-auto max-h-96 custom-scrollbar">
            <DataTable 
              headers={['Electrician', 'Done', 'Wait', 'Last Active']}
              items={reportElectrician}
              renderRow={(item, idx) => (
                <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50/50 text-xs text-center">
                  <td className="px-4 py-3 font-bold text-left">{item.name}</td>
                  <td className="px-4 py-3 text-blue-600 font-bold">{item.completed}</td>
                  <td className="px-4 py-3 text-amber-600 font-bold">{item.pending}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="px-2 py-0.5 rounded bg-slate-50 text-[9px] font-bold uppercase text-slate-400 tracking-tighter">{item.lastActivity}</span>
                  </td>
                </tr>
              )}
            />
          </div>
        );
      default:
        return (
          <div className="overflow-auto max-h-96 custom-scrollbar">
            <DataTable 
              headers={['Title', 'Author', 'Date', 'Export', 'Action']}
              items={data.reports}
              renderRow={(item) => (
                <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50/50 text-xs">
                  <td className="px-4 py-3 font-medium text-slate-900">{item.title}</td>
                  <td className="px-4 py-3 text-slate-600 italic">{item.author}</td>
                  <td className="px-4 py-3 text-slate-500 font-mono">{item.date}</td>
                  <td className="px-4 py-3">
                    <button 
                      onClick={() => exportToCSV([item], `report_${item.id}`)}
                      className="inline-flex items-center gap-1.5 text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg hover:bg-blue-100 transition-colors uppercase tracking-widest"
                    >
                      <Download className="w-3.5 h-3.5" />
                      CSV
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isAdmin && (
                      <button 
                        onClick={() => onDelete(item.id, 'reports')}
                        className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              )}
            />
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full space-y-8 pb-10">
      <div className="px-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Intelligence Reporting</h2>
          </div>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] ml-4">
            Universal Real-time Synchronization Enabled • Active Nodes: 4
          </p>
        </div>
        <button 
          onClick={() => {
            const items = activeTab === 'daily' ? reportDaily : activeTab === 'electrician' ? reportElectrician : data.reports;
            exportToCSV(items, `enterprise_export_${activeTab}`);
          }}
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-300 active:scale-95"
        >
          <Download className="w-4 h-4" />
          Export Active Stream
        </button>
      </div>
      
      <Reorder.Group 
        axis="y" 
        values={sections} 
        onReorder={setSections}
        className="space-y-6"
      >
        {sections.map((section) => (
          <Reorder.Item 
            key={section.id} 
            value={section}
            className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm shadow-slate-200/40 hover:shadow-xl hover:border-slate-300 transition-all active:scale-[0.99] active:shadow-2xl active:z-50 cursor-grab active:cursor-grabbing group"
          >
            <SectionHeader icon={section.icon} title={section.label} id={section.id} />
            <div className="p-4 bg-white">
              <SectionImportZone sectionName={section.label} />
              <div className="mt-2 bg-white rounded-2xl border border-slate-50 overflow-hidden">
                {renderSectionContent(section.id)}
              </div>
            </div>
            <div className="bg-slate-50/30 px-6 py-2 border-t border-slate-50 flex justify-between items-center">
               <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest italic">Data integrity verified via AES-256</span>
               <div className="flex gap-1">
                 {[1,2,3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-slate-200" />)}
               </div>
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  );
}

function MaterialsView({ items, onEdit, onDelete, isAdmin }: { items: Material[]; onEdit: (item: any) => void; onDelete: (id: string, mod: string) => void; isAdmin: boolean }) {
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block">
        <DataTable 
          headers={['Item Name', 'Quantity', 'Unit', 'Status', 'Actions']}
          items={items}
          renderRow={(item) => (
            <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors group">
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
              <td className="px-6 py-4 text-right">
                {isAdmin && (
                  <div className="flex justify-end">
                    <TableActions onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id, 'materials')} />
                  </div>
                )}
              </td>
            </tr>
          )}
        />
      </div>
      
      {/* Mobile Cards */}
      <div className="md:hidden">
        <CardGrid
          items={items}
          renderCard={(item) => (
            <ItemCard>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">{item.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 uppercase">{item.unit}</p>
                </div>
                {isAdmin && <TableActions onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id, 'materials')} />}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="font-mono text-sm font-bold text-slate-900">{item.quantity}</span>
                <span className={`px-2 py-1 text-[10px] font-bold rounded-md uppercase ${
                  item.quantity < 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {item.quantity < 10 ? 'Low' : 'OK'}
                </span>
              </div>
            </ItemCard>
          )}
        />
      </div>
    </>
  );
}

function ClientsView({ items, onEdit, onDelete, isAdmin }: { items: Client[]; onEdit: (item: any) => void; onDelete: (id: string, mod: string) => void; isAdmin: boolean }) {
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block">
        <DataTable 
          headers={['Name', 'Company', 'Phone', 'Actions']}
          items={items}
          renderRow={(item) => (
            <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors group">
              <td className="px-6 py-4 text-sm font-medium text-slate-900">{item.name}</td>
              <td className="px-6 py-4 text-sm text-slate-600">{item.company}</td>
              <td className="px-6 py-4 text-sm text-slate-500 font-mono tracking-tighter">{item.phone}</td>
              <td className="px-6 py-4 text-right">
                {isAdmin && (
                  <div className="flex justify-end">
                    <TableActions onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id, 'clients')} />
                  </div>
                )}
              </td>
            </tr>
          )}
        />
      </div>
      
      {/* Mobile Cards */}
      <div className="md:hidden">
        <CardGrid
          items={items}
          renderCard={(item) => (
            <ItemCard>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">{item.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{item.company}</p>
                </div>
                {isAdmin && <TableActions onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id, 'clients')} />}
              </div>
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-600 font-mono tracking-tighter">{item.phone}</p>
              </div>
            </ItemCard>
          )}
        />
      </div>
    </>
  );
}

function PaymentsView({ items, data, fetchData, user, isAdmin, onDelete }: { items: Payment[]; data: any; fetchData: () => void; user: any; isAdmin: boolean; onDelete: (id: string, mod: string) => void }) {
  const [processing, setProcessing] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutData, setCheckoutData] = useState<{ job: Job; type: string } | null>(null);

  const startPayment = (job: Job, type: string) => {
    setCheckoutData({ job, type });
    setIsCheckoutOpen(true);
  };

  const handleFinalizePayment = async (method: string, methodDetails: any, payerDetails: any) => {
    if (!checkoutData) return;
    const { job, type } = checkoutData;
    
    setProcessing(true);
    try {
      const amount = job.amount || 500;
      // Step 1: Create Order
      const orderRes = await api.post('/api/payments/order', { amount, job_id: job.id, type });
      
      if (orderRes.success) {
        // Step 2: Verify (Passing the selected method and new details)
        const verifyRes = await api.post('/api/payments/verify', {
          order_id: orderRes.data.id,
          amount,
          job_id: job.id,
          type,
          method,
          payer_name: payerDetails.name,
          payer_phone: payerDetails.phone,
          transaction_note: payerDetails.note,
          payment_id: methodDetails.txnId, // Manual txnId
          payer_id: user.role === 'Client' ? data.clients.find((c:any) => c.userId === user.id)?.id : 'admin',
          receiver_id: type === 'admin_to_electrician' ? job.assignedTo : 'admin'
        });
        
        if (verifyRes.success) {
          toast.success(`Payment via ${method} successful!`);
          fetchData();
          setIsCheckoutOpen(false);
        } else {
          toast.error('Payment verification failed');
        }
      } else {
        toast.error('Order creation failed');
      }
    } catch (err) {
      toast.error('Payment gateway error');
    } finally {
      setProcessing(false);
    }
  };

  const isClient = user.role === 'Client';

  return (
    <div className="space-y-6 flex flex-col h-full relative">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Financial System Control</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 whitespace-nowrap">Manage enterprise transactions</p>
        </div>
        {isAdmin && (
           <button 
            onClick={() => {
              const firstJob = data.jobs.find((j:any) => j.status !== 'Paid');
              if (firstJob) startPayment(firstJob, 'admin_to_electrician');
              else toast.error('No pending jobs found for manual payout');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
           >
             <Plus className="w-4 h-4" />
             Record Manual Payout
           </button>
        )}
      </div>

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
          <div className="space-y-3 max-h-80 overflow-auto pr-2 custom-scrollbar">
            {data.jobs.filter((j: any) => j.status !== 'Paid' && (isClient ? j.clientId === data.clients.find((c:any) => c.userId === user.id)?.id : true)).map((job: any) => (
              <div key={job.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between group hover:border-blue-200 transition-all">
                <div>
                  <p className="text-sm font-bold text-slate-800">{job.title}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-tighter">Amount: ₹{job.amount || 0}</p>
                </div>
                <button 
                  disabled={processing}
                  onClick={() => startPayment(job, isClient ? 'client_to_admin' : 'admin_to_electrician')}
                  className="px-4 py-1.5 bg-blue-600 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  Pay Now
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
          headers={['Transaction ID', 'Payer Info', 'Type', 'Method', 'Amount', 'Status', 'Date', 'Actions']}
          items={items}
          renderRow={(item) => (
            <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50/50 text-sm group">
              <td className="px-6 py-4 font-mono text-[11px] text-slate-500">#{item.id.substring(0, 8)}</td>
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-800">{item.payer_name || 'System User'}</span>
                  <span className="text-[9px] text-slate-400 font-medium tracking-tight">{item.payer_phone || 'No Phone'}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                  item.payment_type === 'client_to_admin' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                )}>
                  {item.payment_type.replace(/_/g, ' ')}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                   {item.method === 'UPI' && <Smartphone className="w-3.5 h-3.5 text-slate-400" />}
                   {item.method === 'Card' && <CreditCard className="w-3.5 h-3.5 text-slate-400" />}
                   {item.method === 'Netbanking' && <Building2 className="w-3.5 h-3.5 text-slate-400" />}
                   {item.method === 'Wallet' && <Wallet className="w-3.5 h-3.5 text-slate-400" />}
                   <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{item.method}</span>
                </div>
              </td>
              <td className="px-6 py-4 font-bold text-slate-800">₹{item.amount}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{item.status}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-slate-400 text-[11px] uppercase font-bold">{safeFormat(item.created_at, 'dd MMM, HH:mm')}</td>
              <td className="px-6 py-4 text-right">
                {isAdmin && (
                  <button 
                    onClick={() => onDelete(item.id, 'payments')}
                    className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </td>
            </tr>
          )}
        />
      </div>

      <AnimatePresence>
        {isCheckoutOpen && checkoutData && (
          <PaymentCheckoutModal 
            job={checkoutData.job} 
            processing={processing}
            onClose={() => setIsCheckoutOpen(false)}
            onFinalize={handleFinalizePayment}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PaymentCheckoutModal({ job, processing, onClose, onFinalize }: { job: Job; processing: boolean; onClose: () => void; onFinalize: (method: string, methodDetails: any, payerDetails: any) => void }) {
  const [step, setStep] = useState<'payer' | 'methods' | 'details' | 'review'>('payer');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [methodDetails, setMethodDetails] = useState<any>({});
  const [payerDetails, setPayerDetails] = useState<any>({ name: '', phone: '', note: '' });

  const methods = [
    { id: 'UPI', label: 'UPI / Google Pay', icon: Smartphone, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'Card', label: 'Credit / Debit Card', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'Netbanking', label: 'Net Banking', icon: Building2, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'Wallet', label: 'Digital Wallets', icon: Wallet, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  const handlePayerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('methods');
  };

  const handleMethodSelect = (id: string) => {
    setSelectedMethod(id);
    setStep('details');
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('review');
  };

  const handleFinalSubmit = () => {
    if (selectedMethod) onFinalize(selectedMethod, methodDetails, payerDetails);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 tracking-tight">Checkout Secure</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">₹{job.amount || 0} • Transaction Safety Active</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 'payer' && (
              <motion.form
                key="payer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handlePayerSubmit}
                className="space-y-5"
              >
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Step 1: Payer Identification</p>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Payer Full Name</label>
                    <input 
                      required
                      type="text" 
                      placeholder="John Doe"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none transition-all"
                      value={payerDetails.name}
                      onChange={(e) => setPayerDetails({ ...payerDetails, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
                    <input 
                      required
                      type="tel" 
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none transition-all font-mono"
                      value={payerDetails.phone}
                      onChange={(e) => setPayerDetails({ ...payerDetails, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Transaction Note (Optional)</label>
                    <textarea 
                      placeholder="Payment for electrical audit..."
                      rows={2}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none transition-all resize-none"
                      value={payerDetails.note}
                      onChange={(e) => setPayerDetails({ ...payerDetails, note: e.target.value })}
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all flex items-center justify-center gap-2 mt-4"
                >
                  Continue to Methods
                  <RefreshCw className="w-4 h-4 opacity-30" />
                </button>
              </motion.form>
            )}

            {step === 'methods' && (
              <motion.div
                key="methods"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Step 2: Selection</p>
                  <button onClick={() => setStep('payer')} className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline">Change Payer</button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {methods.map(m => (
                    <button
                      key={m.id}
                      onClick={() => handleMethodSelect(m.id)}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-blue-400 hover:bg-white transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn("p-2 rounded-lg transition-transform group-hover:scale-110", m.bg, m.color)}>
                          <m.icon className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold text-slate-700">{m.label}</span>
                      </div>
                      <ShieldCheck className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 'details' && (
              <motion.form
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleDetailsSubmit}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-4">
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest tracking-widest">Step 3: Verification</p>
                   <button type="button" onClick={() => setStep('methods')} className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1">
                    ← Back
                  </button>
                </div>

                {selectedMethod === 'UPI' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">UPI ID / VPA</label>
                      <input 
                        required
                        type="text" 
                        placeholder="username@okaxis"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none transition-all"
                        onChange={(e) => setMethodDetails({ ...methodDetails, upiId: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Transaction ID / Ref #</label>
                      <input 
                        required
                        type="text" 
                        placeholder="TRN1234567890"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none transition-all font-mono"
                        onChange={(e) => setMethodDetails({ ...methodDetails, txnId: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {selectedMethod === 'Card' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Card Number</label>
                      <input 
                        required
                        type="text" 
                        placeholder="4444 4444 4444 4444"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none transition-all"
                        onChange={(e) => setMethodDetails({ ...methodDetails, cardNumber: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Expiry</label>
                        <input 
                          required
                          type="text" 
                          placeholder="MM/YY"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none transition-all"
                          onChange={(e) => setMethodDetails({ ...methodDetails, expiry: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">CVV</label>
                        <input 
                          required
                          type="password" 
                          placeholder="***"
                          maxLength={3}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none transition-all"
                          onChange={(e) => setMethodDetails({ ...methodDetails, cvv: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedMethod === 'Netbanking' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Select Bank</label>
                      <select 
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none transition-all appearance-none"
                        onChange={(e) => setMethodDetails({ ...methodDetails, bank: e.target.value })}
                      >
                        <option value="">Choose your bank</option>
                        <option>State Bank of India</option>
                        <option>HDFC Bank</option>
                        <option>ICICI Bank</option>
                        <option>Axis Bank</option>
                      </select>
                    </div>
                  </div>
                )}

                {selectedMethod === 'Wallet' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Wallet Name</label>
                      <select 
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none transition-all appearance-none"
                        onChange={(e) => setMethodDetails({ ...methodDetails, wallet: e.target.value })}
                      >
                        <option value="">Select Wallet</option>
                        <option>Paytm</option>
                        <option>PhonePe</option>
                        <option>Amazon Pay</option>
                        <option>MobiKwik</option>
                      </select>
                    </div>
                  </div>
                )}

                <button 
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all flex items-center justify-center gap-2 mt-4"
                >
                  Review Summary
                  <ShieldCheck className="w-4 h-4" />
                </button>
              </motion.form>
            )}

            {step === 'review' && (
              <motion.div
                key="review"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="space-y-6"
              >
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Payable</span>
                    <span className="text-xl font-bold text-slate-900 tracking-tight">₹{job.amount || 0}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Payer</p>
                      <p className="text-xs font-bold text-slate-800 truncate">{payerDetails.name}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Phone</p>
                      <p className="text-xs font-bold text-slate-800 truncate">{payerDetails.phone}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Method</p>
                      <p className="text-xs font-bold text-slate-800 truncate">{selectedMethod}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Job ID</p>
                      <p className="text-xs font-bold text-slate-800 truncate">#{job.id.substring(0, 5)}</p>
                    </div>
                  </div>

                  {payerDetails.note && (
                    <div className="pt-3 border-t border-slate-200">
                       <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Internal Note</p>
                       <p className="text-[10px] text-slate-600 italic leading-relaxed">{payerDetails.note}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-8">
                  <button 
                    onClick={() => setStep('details')}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
                  >
                    Edit Info
                  </button>
                  <button 
                    disabled={processing}
                    onClick={handleFinalSubmit}
                    className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Authorize ₹{job.amount || 0}
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
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

// Mobile Card View Components
function ItemCard({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
      {children}
    </div>
  );
}

function CardGrid({ items, renderCard }: { items: any[]; renderCard: (item: any, idx: number) => ReactNode }) {
  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={item.id}>
          {renderCard(item, idx)}
        </div>
      ))}
    </div>
  );
}
