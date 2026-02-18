import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Calendar as CalendarIcon, LogOut, 
  CheckCircle2, Flame, Target, TrendingUp, 
  Sparkles, ChevronRight, ChevronLeft, Settings
} from 'lucide-react';
import { 
  UserProfile, Role, Platform, Goal, ExperienceLevel, ContentDay, 
  ContentFormat 
} from './types';
import { 
  PLATFORMS, GOALS 
} from './constants';
import { 
  generateMonthCalendar 
} from './geminiService';

declare const confetti: any;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// --- UI Components ---

const SmoothField = React.memo(({ label, value, onChange, placeholder, type = "text", name }: any) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    onChange(e);
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>}
      <input
        type={type}
        name={name}
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all text-white placeholder:text-slate-600 font-medium"
      />
    </div>
  );
});

const Button = React.memo(({ onClick, type = "button", variant = 'primary', className = '', disabled = false, children }: any) => {
  const base = "px-6 py-3 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100 uppercase tracking-wide text-xs";
  const variants: any = {
    primary: "bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/20",
    secondary: "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700",
    danger: "bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/50",
    ghost: "bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white",
    google: "bg-white text-slate-900 hover:bg-slate-100 shadow-xl"
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
});

const Card = ({ children, className = '', onClick }: any) => (
  <div onClick={onClick} className={`glass-card rounded-3xl p-6 transition-all duration-300 ${onClick ? 'cursor-pointer hover:border-cyan-500/50' : ''} ${className}`}>
    {children}
  </div>
);

// --- Main Application ---

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [view, setView] = useState<'landing' | 'login' | 'signup' | 'onboarding' | 'dashboard' | 'settings'>('landing');
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [loadingMessage, setLoadingMessage] = useState("Architecting your era...");

  // Persistence
  useEffect(() => {
    const savedUsers = localStorage.getItem('social_trackr_v2_all_users');
    const savedUser = localStorage.getItem('social_trackr_v2_user');
    if (savedUsers) setUsers(JSON.parse(savedUsers));
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      if (parsed.onboarded) setView('dashboard');
    }
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('social_trackr_v2_user', JSON.stringify(user));
      setUsers(prev => {
        const others = prev.filter(u => u.email !== user.email);
        return [...others, user];
      });
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('social_trackr_v2_all_users', JSON.stringify(users));
  }, [users]);

  // Auth
  const handleGoogleAuth = () => {
    setLoading(true);
    setLoadingMessage("Connecting to Google...");
    setTimeout(() => {
      const email = 'creator.guest@gmail.com';
      const existing = users.find(u => u.email === email);
      if (existing) {
        setUser(existing);
        setView(existing.onboarded ? 'dashboard' : 'onboarding');
      } else {
        const newUser: UserProfile = {
          id: 'g-' + Math.random().toString(36).substr(2, 9),
          name: 'Guest Creator',
          email: email,
          role: Role.USER,
          onboarded: false,
          calendar: [],
          preferredFormats: [ContentFormat.REEL, ContentFormat.POST],
          currentStreak: 0,
          longestStreak: 0,
          createdAt: Date.now()
        };
        setUser(newUser);
        setView('onboarding');
      }
      setLoading(false);
    }, 1500);
  };

  const handleManualAuth = (e: React.FormEvent<HTMLFormElement>, mode: 'login' | 'signup') => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = data.get('email') as string;
    const name = data.get('name') as string;

    const existing = users.find(u => u.email === email);
    if (mode === 'login') {
      if (existing) {
        setUser(existing);
        setView(existing.onboarded ? 'dashboard' : 'onboarding');
      } else alert("Account not found!");
    } else {
      const newUser: UserProfile = {
        id: Math.random().toString(36).substr(2, 9),
        name: name || 'New Creator',
        email: email,
        role: Role.USER,
        onboarded: false,
        calendar: [],
        preferredFormats: [ContentFormat.REEL, ContentFormat.POST],
        currentStreak: 0,
        longestStreak: 0,
        createdAt: Date.now()
      };
      setUser(newUser);
      setView('onboarding');
    }
  };

  const startOnboarding = async (onboardData: any) => {
    if (!user) return;
    setLoading(true);
    setLoadingMessage(`AI is generating strategy for ${MONTH_NAMES[selectedMonth]}...`);
    try {
      const cal = await generateMonthCalendar(
        selectedMonth, 
        onboardData.platform, 
        onboardData.niche, 
        onboardData.goal, 
        ExperienceLevel.BEGINNER, 
        onboardData.preferredFormats
      );
      setUser({
        ...user,
        ...onboardData,
        onboarded: true,
        calendar: cal
      });
      setView('dashboard');
    } catch (err) {
      console.error(err);
      alert("Error generating content. Check your API key in Netlify settings.");
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: number, month: number) => {
    if (!user) return;
    const newCal = user.calendar.map(d => 
      (d.day === day && d.month === month) ? { ...d, completed: !d.completed } : d
    );
    const completedCount = newCal.filter(d => d.completed).length;
    if (completedCount % 10 === 0 && completedCount > 0) confetti({ particleCount: 150, spread: 80, origin: { y: 0.7 } });
    setUser({ ...user, calendar: newCal, currentStreak: completedCount });
  };

  // --- Views ---

  const LandingPage = () => (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-cyan-500/10 blur-[180px] rounded-full" />
      <div className="relative z-10 max-w-5xl space-y-10">
        <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-slate-900/80 border border-slate-800 text-cyan-400 text-xs font-black tracking-[0.3em] animate-pulse">
          <Sparkles size={14} /> AI-POWERED CONSISTENCY
        </div>
        <h1 className="text-8xl md:text-[10rem] font-black font-grotesk tracking-tighter leading-[0.8] mb-4">
          CONTENT<br/><span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">ERA</span>
        </h1>
        <p className="text-xl md:text-3xl text-slate-400 max-w-2xl mx-auto font-medium leading-tight">
          Track 12 months of growth. Automated hooks, daily tasks, and algorithm mastery. No cap.
        </p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-8">
          <Button onClick={() => setView('signup')} className="text-lg px-14 py-6 shadow-2xl">Start Your Era</Button>
          <Button variant="secondary" onClick={() => setView('login')} className="text-lg px-14 py-6">Log In</Button>
        </div>
      </div>
    </div>
  );

  const AuthView = ({ mode }: { mode: 'login' | 'signup' }) => (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
      <Card className="w-full max-w-md space-y-10 p-10 border-2 border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="text-center space-y-2">
          <h2 className="text-4xl font-black font-grotesk uppercase tracking-tight">{mode === 'login' ? 'Main Character' : 'Join Squad'}</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Access your growth engine</p>
        </div>
        <Button variant="google" onClick={handleGoogleAuth} className="w-full py-5 border border-slate-200">
           Continue with Google
        </Button>
        <form onSubmit={(e) => handleManualAuth(e, mode)} className="space-y-4">
          {mode === 'signup' && <SmoothField label="Full Name" name="name" placeholder="Alex Rivera" required />}
          <SmoothField label="Email Address" name="email" type="email" placeholder="alex@creators.co" required />
          <Button type="submit" className="w-full py-5 text-lg">
            {mode === 'login' ? 'Enter Dashboard' : 'Claim Profile'}
          </Button>
        </form>
      </Card>
    </div>
  );

  const OnboardingView = () => {
    const [step, setStep] = useState(1);
    const [data, setData] = useState({
      platform: Platform.INSTAGRAM,
      niche: '',
      goal: Goal.FOLLOWERS,
      preferredFormats: [ContentFormat.REEL, ContentFormat.POST]
    });

    const toggleFormat = (f: ContentFormat) => {
      setData(prev => ({
        ...prev,
        preferredFormats: prev.preferredFormats.includes(f) 
          ? prev.preferredFormats.filter(item => item !== f)
          : [...prev.preferredFormats, f]
      }));
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
        <Card className="w-full max-w-3xl border-2 border-cyan-500/20 shadow-2xl space-y-12 p-12">
          <div className="flex justify-between items-center">
             <div className="space-y-1">
               <h2 className="text-5xl font-black font-grotesk tracking-tight uppercase">Step {step} / 2</h2>
               <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Building your viral architecture</p>
             </div>
             <div className="flex gap-2">
               {[1, 2].map(i => <div key={i} className={`w-16 h-2 rounded-full transition-all duration-500 ${step >= i ? 'bg-cyan-500' : 'bg-slate-800'}`} />)}
             </div>
          </div>

          {step === 1 ? (
            <div className="space-y-10 animate-in slide-in-from-right-8 duration-500">
              <div className="space-y-6">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Growth Platform</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {PLATFORMS.map(p => (
                    <button
                      key={p}
                      onClick={() => setData({ ...data, platform: p as Platform })}
                      className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${data.platform === p ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]' : 'border-slate-800 hover:border-slate-700 text-slate-500'}`}
                    >
                      <span className="text-xs font-black uppercase tracking-tight">{p}</span>
                    </button>
                  ))}
                </div>
              </div>
              <SmoothField 
                label="What's your niche?" 
                placeholder="e.g. AI SaaS, Fitness for Devs, minimalism" 
                value={data.niche} 
                onChange={(e: any) => setData({ ...data, niche: e.target.value })} 
              />
              <Button onClick={() => setStep(2)} disabled={!data.niche} className="w-full py-6 text-xl">Continue <ChevronRight size={20} /></Button>
            </div>
          ) : (
            <div className="space-y-10 animate-in slide-in-from-right-8 duration-500">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-6">
                   <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Target Goal</label>
                   <div className="space-y-3">
                     {GOALS.map(g => (
                       <button
                         key={g}
                         onClick={() => setData({ ...data, goal: g as Goal })}
                         className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${data.goal === g ? 'border-purple-500 bg-purple-500/10 text-purple-400' : 'border-slate-800 text-slate-500'}`}
                       >
                         <span className="text-sm font-black uppercase">{g}</span>
                       </button>
                     ))}
                   </div>
                 </div>
                 <div className="space-y-6">
                   <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Favorite Formats</label>
                   <div className="grid grid-cols-2 gap-3">
                     {Object.values(ContentFormat).map(f => (
                       <button
                         key={f}
                         onClick={() => toggleFormat(f)}
                         className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${data.preferredFormats.includes(f) ? 'border-pink-500 bg-pink-500/10 text-pink-400' : 'border-slate-800 text-slate-600'}`}
                       >
                         {f}
                       </button>
                     ))}
                   </div>
                 </div>
               </div>
               <div className="flex gap-6">
                 <Button variant="secondary" onClick={() => setStep(1)} className="flex-1 py-6">Back</Button>
                 <Button onClick={() => startOnboarding(data)} className="flex-[2] py-6 text-xl">Cook Blueprint</Button>
               </div>
            </div>
          )}
        </Card>
      </div>
    );
  };

  const Dashboard = () => {
    if (!user) return null;
    const currentMonthData = user.calendar.filter(d => d.month === selectedMonth);
    const completedCount = currentMonthData.filter(d => d.completed).length;
    const progress = Math.round((completedCount / (currentMonthData.length || 1)) * 100);
    const currentDay = currentMonthData.find(d => !d.completed);

    return (
      <div className="min-h-screen bg-slate-950 text-white lg:pl-72 flex flex-col font-grotesk">
        <aside className="fixed left-0 top-0 bottom-0 w-72 glass-card border-r border-slate-800 p-8 hidden lg:flex flex-col z-30">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg"><TrendingUp className="text-white" size={24} /></div>
            <span className="text-2xl font-black uppercase tracking-tighter">TRACKR</span>
          </div>
          <nav className="flex-1 space-y-3">
            <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black uppercase text-xs transition-all ${view === 'dashboard' ? 'bg-slate-900 text-cyan-400 border border-slate-800' : 'text-slate-500 hover:text-white'}`}><LayoutDashboard size={20} /> Home</button>
            <button onClick={() => setView('settings')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black uppercase text-xs transition-all ${view === 'settings' ? 'bg-slate-900 text-purple-400 border border-slate-800' : 'text-slate-500 hover:text-white'}`}><Settings size={20} /> Settings</button>
          </nav>
          <div className="pt-8 border-t border-slate-900 space-y-6">
             <button onClick={() => { setUser(null); setView('landing'); }} className="w-full flex items-center gap-2 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/10 p-4 rounded-xl transition-all"><LogOut size={16} /> Logout</button>
          </div>
        </aside>

        <header className="p-8 border-b border-slate-900 bg-slate-950/50 sticky top-0 backdrop-blur-xl z-20 flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="flex items-center gap-6 bg-slate-900 p-2 rounded-2xl border border-slate-800 shadow-xl">
             <button onClick={() => setSelectedMonth(prev => Math.max(0, prev - 1))} className="p-3 hover:bg-slate-800 rounded-xl transition-all disabled:opacity-20" disabled={selectedMonth === 0}><ChevronLeft size={20} /></button>
             <div className="min-w-[160px] text-center">
               <span className="text-lg font-black uppercase tracking-widest">{MONTH_NAMES[selectedMonth]} 2025</span>
             </div>
             <button onClick={() => setSelectedMonth(prev => Math.min(11, prev + 1))} className="p-3 hover:bg-slate-800 rounded-xl transition-all disabled:opacity-20" disabled={selectedMonth === 11}><ChevronRight size={20} /></button>
           </div>
           <div className="text-right">
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Consistency Streak</p>
             <div className="flex items-center gap-3">
               <Flame className="text-orange-500 animate-bounce" size={24} />
               <span className="text-3xl font-black uppercase">{user.currentStreak} DAYS</span>
             </div>
           </div>
        </header>

        <main className="p-8 space-y-12 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="md:col-span-2 border-cyan-500/20 bg-cyan-500/5">
              <div className="flex justify-between mb-4">
                <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Monthly Goal</p>
                <span className="text-xs font-black">{progress}%</span>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-6xl font-black">{completedCount} / {DAYS_IN_MONTH[selectedMonth] || 30}</span>
                <span className="text-sm font-bold text-slate-500 uppercase">Tracked</span>
              </div>
              <div className="mt-6 h-3 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.8)]" style={{ width: `${progress}%` }} />
              </div>
            </Card>
            <Card className="border-purple-500/20 bg-purple-500/5 flex flex-col justify-between">
              <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Niche</p>
              <p className="text-3xl font-black uppercase truncate">{user.niche}</p>
            </Card>
            <Card className="border-pink-500/20 bg-pink-500/5 flex flex-col justify-between">
              <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Target</p>
              <p className="text-3xl font-black uppercase truncate">{user.goal}</p>
            </Card>
          </div>

          <section className="space-y-8">
            <h2 className="text-4xl font-black uppercase tracking-tighter">Plan</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
              {currentMonthData.map(d => (
                <div key={d.day} onClick={() => toggleDay(d.day, d.month)} className={`aspect-square p-4 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between ${d.completed ? 'bg-cyan-500 border-cyan-400' : 'bg-slate-900 border-slate-800'}`}>
                  <p className="text-xl font-black">{d.day}</p>
                  <p className="text-[8px] font-black uppercase opacity-60 truncate">{d.format}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-12 pb-24">
            <div className="space-y-8">
              <h2 className="text-3xl font-black uppercase tracking-tight">Timeline</h2>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4 custom-scroll">
                {currentMonthData.map(d => (
                  <Card key={d.day} className={`border-l-8 ${d.completed ? 'border-l-cyan-500' : 'border-l-slate-800'}`}>
                    <div className="flex justify-between items-center gap-4">
                      <div className="flex-1">
                        <span className="text-[10px] font-black text-cyan-400 uppercase">DAY {d.day}</span>
                        <h3 className="text-lg font-black uppercase truncate">{d.hook}</h3>
                      </div>
                      <button onClick={() => toggleDay(d.day, d.month)} className={`p-4 rounded-2xl ${d.completed ? 'bg-cyan-500' : 'bg-slate-800'}`}><CheckCircle2 /></button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tight mb-8">Next Up</h2>
              {currentDay ? (
                <Card className="border-4 border-cyan-500/30 p-10 space-y-6">
                   <p className="text-[10px] font-black text-slate-500 uppercase">Day {currentDay.day}</p>
                   <h3 className="text-3xl font-black uppercase text-cyan-400">{currentDay.hook}</h3>
                   <p className="text-slate-400 font-medium italic">"{currentDay.tip}"</p>
                   <Button onClick={() => toggleDay(currentDay.day, currentDay.month)} className="w-full py-6 text-xl">FINISH POST</Button>
                </Card>
              ) : <p>All caught up!</p>}
            </div>
          </section>
        </main>
      </div>
    );
  };

  const SettingsView = () => {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center lg:pl-72 p-6">
        <Card className="w-full max-w-2xl p-12 text-center">
          <h2 className="text-4xl font-black uppercase mb-8">Settings</h2>
          <Button onClick={() => setView('dashboard')}>Back to Dashboard</Button>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {view === 'landing' && <LandingPage />}
      {(view === 'login' || view === 'signup') && <AuthView mode={view} />}
      {view === 'onboarding' && <OnboardingView />}
      {view === 'dashboard' && <Dashboard />}
      {view === 'settings' && <SettingsView />}
      {loading && (
        <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col items-center justify-center gap-8">
          <div className="w-24 h-24 border-4 border-slate-800 border-t-cyan-500 animate-spin rounded-full" />
          <h2 className="text-2xl font-black uppercase">{loadingMessage}</h2>
        </div>
      )}
    </div>
  );
}