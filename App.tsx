import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  MessageSquare, 
  LogOut, 
  Plus, 
  CheckCircle2, 
  Flame, 
  Target, 
  TrendingUp,
  User as UserIcon,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Trash2,
  X as CloseIcon,
  RefreshCw,
  Send,
  Loader2,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { 
  UserProfile, 
  Role, 
  Platform, 
  Goal, 
  ExperienceLevel, 
  ContentDay, 
  ChatMessage 
} from './types.ts';
import { 
  ADMIN_EMAIL, 
  ADMIN_PASSWORD, 
  PLATFORMS, 
  GOALS, 
  LEVELS, 
  SUGGESTED_PROMPTS 
} from './constants.ts';
import { 
  generate30DayCalendar, 
  chatWithAI, 
  regenerateDay 
} from './geminiService.ts';

// --- Utility for Confetti (loaded via CDN in index.html) ---
declare const confetti: any;

// --- Components ---

const Button: React.FC<{
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  className?: string;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ onClick, type = "button", variant = 'primary', className = '', disabled = false, children }) => {
  const base = "px-4 py-2 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100";
  const variants = {
    primary: "bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/20",
    secondary: "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700",
    danger: "bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/50",
    ghost: "bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white"
  };
  
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div onClick={onClick} className={`glass-card rounded-2xl p-6 transition-all duration-300 ${onClick ? 'cursor-pointer hover:border-purple-500/50' : ''} ${className}`}>
    {children}
  </div>
);

const Input: React.FC<{
  label?: string;
  name?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  required?: boolean;
}> = ({ label, name, type = "text", placeholder, value, onChange, className = '', required = false }) => (
  <div className={`space-y-2 ${className}`}>
    {label && <label className="block text-sm font-medium text-slate-400 ml-1">{label}</label>}
    <input
      name={name}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-white placeholder:text-slate-600"
    />
  </div>
);

// --- Main App Component ---

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [view, setView] = useState<'landing' | 'login' | 'signup' | 'onboarding' | 'dashboard' | 'admin'>('landing');
  const [loading, setLoading] = useState(false);
  
  // Onboarding state
  const [onboardingData, setOnboardingData] = useState({
    platform: Platform.INSTAGRAM,
    niche: '',
    goal: Goal.FOLLOWERS,
    level: ExperienceLevel.BEGINNER
  });

  // Chatbot state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Persistent Storage initialization
  useEffect(() => {
    const savedUser = localStorage.getItem('social_trackr_user');
    const savedUsers = localStorage.getItem('social_trackr_all_users');
    
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      const initialAdmin: UserProfile = {
        id: 'admin-1',
        name: 'Trackr Boss',
        email: ADMIN_EMAIL,
        role: Role.ADMIN,
        onboarded: true,
        calendar: [],
        currentStreak: 0,
        longestStreak: 0,
        createdAt: Date.now()
      };
      setUsers([initialAdmin]);
      localStorage.setItem('social_trackr_all_users', JSON.stringify([initialAdmin]));
    }

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Sync state with localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('social_trackr_user', JSON.stringify(user));
      setUsers(prev => {
        const index = prev.findIndex(u => u.id === user.id);
        if (index > -1) {
          const newUsers = [...prev];
          newUsers[index] = user;
          return newUsers;
        }
        return [...prev, user];
      });
    } else {
      localStorage.removeItem('social_trackr_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('social_trackr_all_users', JSON.stringify(users));
  }, [users]);

  // Auth Handlers
  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const adminUser = users.find(u => u.email === ADMIN_EMAIL);
      if (adminUser) {
        setUser(adminUser);
        setView('admin');
      }
      return;
    }

    const foundUser = users.find(u => u.email === email);
    if (foundUser) {
      setUser(foundUser);
      setView(foundUser.onboarded ? 'dashboard' : 'onboarding');
    } else {
      alert("Account not found. Sign up to start your era! ✨");
    }
  };

  const handleSignup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('userName') as string;
    const email = formData.get('email') as string;

    if (users.find(u => u.email === email)) {
      alert("Email already exists, bestie!");
      return;
    }

    const newUser: UserProfile = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      role: Role.USER,
      onboarded: false,
      calendar: [],
      currentStreak: 0,
      longestStreak: 0,
      createdAt: Date.now()
    };

    setUsers(prev => [...prev, newUser]);
    setUser(newUser);
    setView('onboarding');
  };

  const handleLogout = () => {
    setUser(null);
    setView('landing');
  };

  const toggleDayCompletion = (dayNum: number) => {
    if (!user) return;
    const newCalendar = [...user.calendar];
    const index = newCalendar.findIndex(d => d.day === dayNum);
    if (index === -1) return;

    const wasCompleted = newCalendar[index].completed;
    newCalendar[index].completed = !wasCompleted;

    const totalCompleted = newCalendar.filter(d => d.completed).length;
    if (totalCompleted === 30 && !wasCompleted) {
      if (typeof confetti !== 'undefined') {
        confetti({
          particleCount: 200,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#a855f7', '#ec4899']
        });
      }
    }

    setUser({
      ...user,
      calendar: newCalendar,
      currentStreak: totalCompleted,
      longestStreak: Math.max(user.longestStreak, totalCompleted)
    });
  };

  const startOnboarding = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const calendar = await generate30DayCalendar(
        onboardingData.platform,
        onboardingData.niche,
        onboardingData.goal,
        onboardingData.level
      );
      
      setUser({
        ...user,
        onboarded: true,
        platform: onboardingData.platform,
        niche: onboardingData.niche,
        goal: onboardingData.goal,
        level: onboardingData.level,
        calendar
      });
      setView('dashboard');
    } catch (err) {
      alert("AI had a glitch. Try again in a bit!");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshDay = async (dayNum: number) => {
    if (!user || !user.platform || !user.niche) return;
    setLoading(true);
    try {
      const dayIndex = user.calendar.findIndex(d => d.day === dayNum);
      const newDay = await regenerateDay(user.platform, user.niche, dayNum, user.calendar[dayIndex]);
      const newCalendar = [...user.calendar];
      newCalendar[dayIndex] = newDay;
      setUser({ ...user, calendar: newCalendar });
    } catch (err) {
      alert("Refresh failed. The AI is tired.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (customMessage?: string) => {
    const text = customMessage || chatInput;
    if (!text.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: Date.now()
    };

    setChatHistory(prev => [...prev, newMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await chatWithAI(text, {
        platform: user?.platform,
        niche: user?.niche,
        currentDayContent: user?.calendar.find(d => !d.completed)
      });

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: response,
        timestamp: Date.now()
      };
      setChatHistory(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  // --- Views ---

  const LandingPage = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center overflow-hidden relative bg-slate-950">
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-cyan-500/5 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-500/5 blur-[120px] rounded-full"></div>
      
      <div className="relative z-10 space-y-12 max-w-5xl">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 text-cyan-400 text-sm font-semibold tracking-wide animate-pulse">
          <Sparkles size={16} /> YOUR VIRAL ERA STARTS NOW
        </div>
        
        <h1 className="text-7xl md:text-9xl font-black font-grotesk tracking-tighter leading-none">
          SOCIAL <br/><span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">TRACKR</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
          The AI companion that turns content consistency into a high-score game. Track, grow, and dominate.
        </p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          <Button onClick={() => setView('signup')} className="text-xl px-10 py-5 group">
            Start the Streak <ChevronRight className="group-hover:translate-x-1 transition-transform" size={24} />
          </Button>
          <Button variant="secondary" onClick={() => setView('login')} className="text-xl px-10 py-5">
            Log In
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16 opacity-60">
          {[
            { label: '30-Day Strategy', icon: Calendar, color: 'text-cyan-400' },
            { label: 'AI Assistance', icon: MessageSquare, color: 'text-purple-400' },
            { label: 'Streak Tracking', icon: Flame, color: 'text-orange-400' },
            { label: 'Viral Roadmap', icon: TrendingUp, color: 'text-pink-400' }
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-3">
              <div className={`p-5 rounded-3xl bg-slate-900 border border-slate-800 ${item.color}`}>
                <item.icon size={32} />
              </div>
              <span className="text-sm font-bold uppercase tracking-widest text-slate-500">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const AuthView = ({ mode }: { mode: 'login' | 'signup' }) => (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
      <Card className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-3">
          <h2 className="text-4xl font-black font-grotesk uppercase tracking-tight">
            {mode === 'login' ? 'Welcome Back' : 'Sign Up'}
          </h2>
          <p className="text-slate-400 font-medium">
            {mode === 'login' ? 'Let\'s keep the streak alive.' : 'Build your custom growth engine.'}
          </p>
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-5">
          {mode === 'signup' && (
            <Input label="What's your name?" name="userName" placeholder="e.g. Alex Rivera" required />
          )}
          <Input label="Email" name="email" type="email" placeholder="hello@you.com" required />
          <Input label="Password" name="password" type="password" placeholder="••••••••" required />
          
          <Button type="submit" className="w-full py-4 text-lg font-bold uppercase tracking-widest">
            {mode === 'login' ? 'Login' : 'Create Account'}
          </Button>
        </form>

        <div className="text-center pt-2">
          <button 
            onClick={() => setView(mode === 'login' ? 'signup' : 'login')}
            className="text-slate-500 hover:text-cyan-400 text-sm font-bold transition-colors uppercase tracking-widest"
          >
            {mode === 'login' ? "New here? Sign up" : "Already a member? Login"}
          </button>
        </div>

        {mode === 'login' && (
          <div className="pt-8 border-t border-slate-800 text-center">
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em] mb-3">Admin Bypass</p>
            <code className="bg-slate-900 px-3 py-1.5 rounded-lg text-[10px] text-slate-500 font-mono">
              admin@socialtrackr.com / admin123
            </code>
          </div>
        )}
      </Card>
    </div>
  );

  const OnboardingView = () => (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
      <Card className="w-full max-w-2xl space-y-10 border-2 border-purple-500/20">
        <div className="space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center mb-4">
            <Sparkles className="text-white" size={28} />
          </div>
          <h2 className="text-4xl font-black font-grotesk tracking-tight uppercase">Custom Strategy</h2>
          <p className="text-slate-400 font-medium">Tell us what you're building. We'll handle the roadmap.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Platform</label>
              <div className="grid grid-cols-2 gap-2">
                {PLATFORMS.map(p => (
                  <button
                    key={p}
                    onClick={() => setOnboardingData({...onboardingData, platform: p as Platform})}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${onboardingData.platform === p ? 'bg-cyan-500 border-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            
            <Input 
              label="Your Niche" 
              placeholder="e.g. Web3 Dev, Fitness, Anime Reviews" 
              value={onboardingData.niche}
              onChange={(e) => setOnboardingData({...onboardingData, niche: e.target.value})}
            />
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Growth Goal</label>
              <div className="space-y-2">
                {GOALS.map(g => (
                  <button
                    key={g}
                    onClick={() => setOnboardingData({...onboardingData, goal: g as Goal})}
                    className={`w-full px-4 py-3 rounded-xl text-left text-sm font-bold border transition-all ${onboardingData.goal === g ? 'bg-purple-500 border-purple-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Experience</label>
              <div className="flex gap-2">
                {LEVELS.map(l => (
                  <button
                    key={l}
                    onClick={() => setOnboardingData({...onboardingData, level: l as ExperienceLevel})}
                    className={`flex-1 px-3 py-2.5 rounded-xl text-[10px] font-bold border transition-all ${onboardingData.level === l ? 'bg-pink-500 border-pink-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Button 
          disabled={!onboardingData.niche || loading} 
          onClick={startOnboarding} 
          className="w-full py-5 text-xl font-black uppercase tracking-widest"
        >
          {loading ? <Loader2 className="animate-spin" /> : 'GENERATE ROADMAP'}
        </Button>
      </Card>
    </div>
  );

  const Sidebar = () => (
    <aside className="fixed left-0 top-0 bottom-0 w-72 glass-card border-r border-slate-800/50 p-8 hidden lg:flex flex-col z-30">
      <div className="flex items-center gap-3 mb-12">
        <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <TrendingUp className="text-white" size={28} />
        </div>
        <span className="text-2xl font-black font-grotesk tracking-tight uppercase">Trackr</span>
      </div>

      <nav className="flex-1 space-y-3">
        <button 
          onClick={() => setView('dashboard')}
          className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${view === 'dashboard' ? 'bg-slate-800 text-cyan-400 font-bold' : 'text-slate-400 hover:bg-slate-800/30'}`}
        >
          <LayoutDashboard size={22} /> Dashboard
        </button>
        {user?.role === Role.ADMIN && (
          <button 
            onClick={() => setView('admin')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${view === 'admin' ? 'bg-slate-800 text-purple-400 font-bold' : 'text-slate-400 hover:bg-slate-800/30'}`}
          >
            <ShieldCheck size={22} /> Admin Control
          </button>
        )}
      </nav>

      <div className="pt-8 border-t border-slate-800 flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-slate-400">
            {user?.name?.[0]}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-500 truncate uppercase tracking-widest">{user?.role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-4 px-5 py-3 text-slate-500 hover:text-rose-400 transition-colors text-sm font-bold uppercase tracking-widest">
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </aside>
  );

  const AdminView = () => (
    <div className="min-h-screen p-6 lg:pl-80 bg-slate-950">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black font-grotesk uppercase tracking-tight">Global Stats</h1>
          <p className="text-slate-500">Overview of all active creators.</p>
        </div>
        <Button variant="ghost" className="lg:hidden" onClick={handleLogout}><LogOut size={20} /></Button>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="border-cyan-500/20">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Users</p>
          <p className="text-5xl font-black">{users.length}</p>
        </Card>
        <Card className="border-purple-500/20">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Active Streaks</p>
          <p className="text-5xl font-black">{users.filter(u => u.currentStreak > 0).length}</p>
        </Card>
        <Card className="border-pink-500/20">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Strategies Set</p>
          <p className="text-5xl font-black">{users.filter(u => u.onboarded).length}</p>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900/50 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Creator</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Strategy</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Progress</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-900/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {u.onboarded ? (
                      <span className="text-cyan-400 font-bold">{u.platform} • {u.niche}</span>
                    ) : (
                      <span className="text-slate-600 italic">No setup</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden w-24">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-500 to-purple-600" 
                          style={{ width: `${Math.round((u.calendar.filter(d => d.completed).length / 30) * 100)}%` }} 
                        />
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-500">{u.calendar.filter(d => d.completed).length}/30</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {u.email !== ADMIN_EMAIL && (
                      <button 
                        onClick={() => setUsers(prev => prev.filter(curr => curr.id !== u.id))}
                        className="p-2 text-slate-600 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const DashboardView = () => {
    if (!user) return null;
    const progress = Math.round((user.calendar.filter(d => d.completed).length / 30) * 100);
    const today = user.calendar.find(d => !d.completed) || user.calendar[user.calendar.length - 1];

    return (
      <div className="min-h-screen p-6 lg:pl-80 bg-slate-950">
        <header className="mb-10 lg:flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black font-grotesk uppercase tracking-tight">Main Hub</h1>
            <p className="text-slate-500">Your roadmap to the main stage.</p>
          </div>
          <div className="flex items-center gap-4 mt-4 lg:mt-0">
             <Button variant="secondary" onClick={startOnboarding}><RefreshCw size={18} /> Refresh Plan</Button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="border-orange-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Streak</span>
              <Flame size={16} className="text-orange-500" />
            </div>
            <p className="text-4xl font-black">{user.currentStreak} <span className="text-sm font-medium text-slate-500">DAYS</span></p>
          </Card>
          
          <Card className="border-cyan-500/20">
             <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Progress</span>
              <Target size={16} className="text-cyan-400" />
            </div>
            <p className="text-4xl font-black">{progress}%</p>
          </Card>

          <Card className="border-purple-500/20">
             <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Goal</span>
              <Sparkles size={16} className="text-purple-400" />
            </div>
            <p className="text-lg font-bold leading-tight uppercase">{user.goal}</p>
          </Card>

          <Card className="border-pink-500/20">
             <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Platform</span>
              <TrendingUp size={16} className="text-pink-400" />
            </div>
            <p className="text-xl font-bold uppercase">{user.platform}</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          <div className="xl:col-span-2 space-y-10">
            <h2 className="text-2xl font-black font-grotesk uppercase tracking-tight">The 30-Day Grid</h2>
            <div className="grid grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-3">
              {user.calendar.map(d => (
                <button
                  key={d.day}
                  onClick={() => toggleDayCompletion(d.day)}
                  className={`aspect-square rounded-xl font-bold flex items-center justify-center transition-all duration-300 border-2 ${d.completed ? 'bg-cyan-500 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'bg-slate-900 border-slate-800 text-slate-600 hover:border-slate-700'}`}
                >
                  {d.day}
                </button>
              ))}
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-black font-grotesk uppercase tracking-tight">Content Pipeline</h2>
              <div className="grid grid-cols-1 gap-4 h-[600px] overflow-y-auto pr-4 scroll-smooth">
                {user.calendar.map(d => (
                  <Card key={d.day} className={`group border ${d.completed ? 'border-green-500/20 bg-green-500/5' : 'border-slate-800 hover:border-slate-700'}`}>
                    <div className="flex items-start justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black bg-slate-800 px-2 py-1 rounded text-slate-400 uppercase tracking-widest">Day {d.day}</span>
                          <span className="text-xs font-bold text-cyan-400 uppercase">{d.format}</span>
                          {d.completed && <CheckCircle2 size={16} className="text-green-500" />}
                        </div>
                        <h3 className="text-lg font-bold group-hover:text-cyan-400 transition-colors">{d.hook}</h3>
                        <p className="text-sm text-slate-500 line-clamp-2 italic">"{d.caption}"</p>
                      </div>
                      <div className="flex gap-2">
                         <button onClick={() => handleRefreshDay(d.day)} className="p-2 bg-slate-800/50 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"><RefreshCw size={16} /></button>
                         <button onClick={() => toggleDayCompletion(d.day)} className={`p-2 rounded-lg transition-all ${d.completed ? 'bg-green-500 text-white' : 'bg-slate-800/50 hover:bg-slate-700 text-slate-400'}`}><CheckCircle2 size={16} /></button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <h2 className="text-2xl font-black font-grotesk uppercase tracking-tight text-center">Current Target</h2>
            {today && (
              <Card className="border-4 border-purple-500/50 shadow-[0_0_40px_rgba(168,85,247,0.2)] sticky top-6">
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Today's Format</p>
                      <p className="text-2xl font-black text-purple-400 uppercase">{today.format}</p>
                    </div>
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800">
                      <Target size={24} className="text-purple-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hook</p>
                    <p className="text-xl font-bold leading-tight">{today.hook}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Caption Strategy</p>
                    <p className="text-sm text-slate-400 leading-relaxed font-medium">{today.caption}</p>
                  </div>

                  <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-cyan-400" />
                      <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">AI Tip</p>
                    </div>
                    <p className="text-xs text-slate-300 italic">{today.tip}</p>
                  </div>

                  <Button onClick={() => toggleDayCompletion(today.day)} className="w-full py-5 text-lg uppercase tracking-[0.2em] font-black">
                    {today.completed ? 'COMPLETED ✓' : 'SECURE THE W'}
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ChatBot = () => (
    <>
      <button 
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 shadow-2xl shadow-purple-500/40 flex items-center justify-center text-white active:scale-90 transition-all z-50 hover:rotate-6"
      >
        {chatOpen ? <CloseIcon size={32} /> : <MessageSquare size={32} />}
      </button>

      {chatOpen && (
        <Card className="fixed bottom-28 right-8 w-[90vw] max-w-[420px] h-[650px] z-50 flex flex-col p-0 overflow-hidden border-2 border-purple-500/50 shadow-2xl animate-in slide-in-from-bottom-10">
          <div className="p-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-2xl bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20"><Sparkles size={20} className="text-white" /></div>
               <div>
                 <p className="text-sm font-black uppercase tracking-tight">Trackr AI</p>
                 <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">Ready to grow</p>
               </div>
             </div>
             <button onClick={() => setChatOpen(false)} className="text-slate-500 hover:text-white"><CloseIcon size={20} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-950/50">
            {chatHistory.length === 0 && (
              <div className="text-center py-12 space-y-6">
                <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto border border-slate-800"><MessageSquare size={32} className="text-slate-700" /></div>
                <div className="space-y-2">
                  <p className="text-lg font-bold">What's the play today?</p>
                  <p className="text-xs text-slate-500 px-10">Need a better hook? Or maybe a script for a Reel? Ask me anything.</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 px-4">
                  {SUGGESTED_PROMPTS.map(p => (
                    <button 
                      key={p} 
                      onClick={() => handleSendMessage(p)}
                      className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 px-4 py-2 rounded-xl border border-slate-800 transition-all font-bold uppercase"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {chatHistory.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium leading-relaxed ${msg.role === 'user' ? 'bg-cyan-500 text-white rounded-tr-none' : 'bg-slate-900 text-slate-300 rounded-tl-none border border-slate-800'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {chatLoading && (
               <div className="flex justify-start">
                  <div className="bg-slate-900 p-4 rounded-2xl rounded-tl-none border border-slate-800 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
               </div>
            )}
          </div>

          <div className="p-5 border-t border-slate-800 bg-slate-900">
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-3">
              <input 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Drop a question..."
                className="flex-1 bg-slate-950 border-none rounded-xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-purple-500/50 outline-none text-white font-medium"
              />
              <button disabled={chatLoading} type="submit" className="w-12 h-12 bg-purple-600 rounded-xl text-white hover:bg-purple-500 transition-all flex items-center justify-center shadow-lg shadow-purple-500/20"><Send size={20} /></button>
            </form>
          </div>
        </Card>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white font-grotesk selection:bg-cyan-500/30 selection:text-cyan-400">
      {(view === 'dashboard' || view === 'admin') && <Sidebar />}
      
      <main className="transition-all duration-500">
        {view === 'landing' && <LandingPage />}
        {view === 'login' && <AuthView mode="login" />}
        {view === 'signup' && <AuthView mode="signup" />}
        {view === 'onboarding' && <OnboardingView />}
        {view === 'dashboard' && <DashboardView />}
        {view === 'admin' && <AdminView />}
      </main>

      {user && view !== 'onboarding' && <ChatBot />}
      
      {loading && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[100] flex flex-col items-center justify-center gap-8">
          <div className="relative">
            <div className="w-32 h-32 border-4 border-cyan-500/10 rounded-full border-t-cyan-500 animate-spin" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
               <Sparkles className="text-purple-500 animate-pulse" size={40} />
            </div>
          </div>
          <div className="text-center space-y-3">
             <h2 className="text-4xl font-black uppercase tracking-tighter">Cooking your strategy...</h2>
             <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-sm">AI is building your viral era</p>
          </div>
        </div>
      )}
    </div>
  );
}