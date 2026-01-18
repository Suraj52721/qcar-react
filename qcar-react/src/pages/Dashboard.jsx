import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MessageSquare, Calendar, FolderKanban, FileText, ShieldCheck,
  Clock, Heart, Send, Plus, User, LogOut, Video, Gamepad2, Users, X, Radio, CheckSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AppBox = ({ children, title, icon: Icon, span = "col-span-1", className = "" }) => (
  <div className={`${span} bg-[#0d0d0d] border border-zinc-800/60 rounded-[2.5rem] p-6 flex flex-col hover:border-zinc-700/50 transition-all group relative overflow-hidden ${className}`}>
    <div className="flex items-center gap-2 mb-4">
      <div className="p-2 bg-zinc-900 rounded-xl group-hover:bg-zinc-800 transition-colors text-zinc-400 group-hover:text-white">
        {Icon && <Icon size={14} />}
      </div>
      <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500">{title}</h3>
    </div>
    <div className="flex-1 overflow-hidden relative">
      {children}
    </div>
  </div>
);

export default function Dashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("Alex");

  // App States
  const [messages, setMessages] = useState([{ id: 1, text: "Check the new deadline.", user: "Maya" }]);
  const [chatInput, setChatInput] = useState("");
  const [deadlines, setDeadlines] = useState([{ id: 1, task: "Beta Launch", date: "Jan 24" }]);
  const [tasks, setTasks] = useState([
    { id: 1, text: "Finalize UI", done: true },
    { id: 2, text: "Connect Supabase", done: false },
    { id: 3, text: "Deploy to Vercel", done: false }
  ]);
  const [time, setTime] = useState(new Date());
  const chatEndRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 40 Message Welcome Engine (Changes every 4 hours)
  const welcomeMessage = useMemo(() => {
    const hr = new Date().getHours();
    const bracket = Math.floor(hr / 4);
    const greets = [
      ["Night shift starts.", "The code never sleeps.", "Midnight focus."],
      ["Dawn of Genesis.", "Morning, Architect.", "Coffee & Code."],
      ["Deep work active.", "Morning Sprint.", "Peak Energy."],
      ["Mid-day Momentum.", "Afternoon grind.", "System Optimized."],
      ["Evening Refactor.", "Golden hour sync.", "Wrapping up."],
      ["Night mode on.", "Midnight Oil.", "Stars & Scripts."]
    ];
    const pool = greets[bracket] || greets[0];
    return `${pool[Math.floor(Math.random() * pool.length)]}, ${userName}`;
  }, [isLoggedIn, Math.floor(new Date().getHours() / 4)]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setMessages([...messages, { id: Date.now(), text: chatInput, user: "You" }]);
    setChatInput("");
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-white font-sans">
        <div className="w-full max-w-sm bg-[#0d0d0d] p-12 border border-zinc-800 rounded-[3rem] text-center">
          <User className="mx-auto mb-6 text-zinc-500" size={40} />
          <h2 className="text-xl font-bold mb-8 uppercase tracking-widest text-zinc-400">Bento OS</h2>
          <input type="text" placeholder="Your Name" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl outline-none mb-4" />
          <button onClick={() => setIsLoggedIn(true)} className="w-full bg-white text-black font-bold py-4 rounded-2xl">Initialize</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-300 p-6 md:p-10 font-sans">

      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-white text-4xl font-light tracking-tighter">{welcomeMessage}</h1>
          <p className="text-zinc-600 text-[10px] font-mono uppercase tracking-[0.2em] mt-2 italic">Broadcast: System Stable</p>
        </div>
        <button onClick={() => setIsLoggedIn(false)} className="p-4 bg-[#0d0d0d] border border-zinc-800 rounded-3xl text-zinc-600 hover:text-white transition"><LogOut size={20} /></button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[220px]">

        {/* 1. PROJECT PROGRESS */}
        <AppBox title="Project Focus" icon={FolderKanban} span="md:col-span-2 md:row-span-2">
          <div className="mt-6 flex flex-col h-full justify-between">
            <h2 className="text-6xl font-thin text-white tracking-tighter italic">Genesis</h2>
            <div className="mb-6">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                <span>Phase 04 Deployment</span>
                <span className="text-white">84%</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: "84%" }} className="h-full bg-white" />
              </div>
            </div>
          </div>
        </AppBox>

        {/* 2. FUNCTIONAL TEAM CHAT */}
        <AppBox title="Messenger" icon={MessageSquare} span="md:col-span-1 md:row-span-2">
          <div className="flex flex-col h-full text-[11px]">
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 custom-scrollbar">
              {messages.map(m => (
                <div key={m.id} className={`p-3 rounded-2xl ${m.user === 'You' ? 'bg-white text-black ml-4' : 'bg-zinc-900 border border-white/5 mr-4'}`}>
                  <span className="block font-bold text-[8px] opacity-50 uppercase mb-1">{m.user}</span>
                  {m.text}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={sendMessage} className="flex gap-2">
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type..." className="flex-1 bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-[11px] outline-none focus:border-zinc-500" />
              <button type="submit" className="p-3 bg-white text-black rounded-xl"><Send size={14} /></button>
            </form>
          </div>
        </AppBox>

        {/* 3. TEAM CHECKLIST (Replaced Broken Globe) */}
        <AppBox title="Checklist" icon={CheckSquare} span="md:col-span-1 md:row-span-2">
          <div className="space-y-3">
            {tasks.map(t => (
              <div key={t.id} onClick={() => toggleTask(t.id)} className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition ${t.done ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-700 group-hover:border-zinc-500'}`}>
                  {t.done && <X size={10} className="text-black" />}
                </div>
                <span className={`text-xs ${t.done ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>{t.text}</span>
              </div>
            ))}
            <button className="mt-4 text-[10px] text-zinc-600 hover:text-white uppercase tracking-widest">+ Add Task</button>
          </div>
        </AppBox>

        {/* 4. DEADLINE CALENDAR */}
        <AppBox title="Deadlines" icon={Calendar}>
          <div className="space-y-3 mt-2">
            {deadlines.map(d => (
              <div key={d.id} className="bg-zinc-900 p-2 rounded-xl border border-white/5 flex justify-between items-center">
                <span className="text-[10px] text-white">{d.task}</span>
                <span className="text-[10px] text-emerald-500 font-mono">{d.date}</span>
              </div>
            ))}
            <button className="w-full py-2 bg-white/5 rounded-lg text-[9px] uppercase font-bold tracking-widest hover:bg-white/10 transition">Set Deadline</button>
          </div>
        </AppBox>

        {/* 5. G-MEET LAUNCHER */}
        <AppBox title="Meeting" icon={Video}>
          <button onClick={() => window.open('https://meet.google.com/new', '_blank')} className="w-full h-full bg-zinc-900 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white hover:text-black transition">
            <Video size={20} />
            <span className="text-[9px] font-bold uppercase tracking-widest">Start Now</span>
          </button>
        </AppBox>

        {/* 6. VAULT */}
        <AppBox title="Vault" icon={ShieldCheck}>
          <div className="space-y-2 text-[10px]">
            <div className="p-2 bg-zinc-900 border border-white/5 rounded-xl flex justify-between items-center">
              <span>api_keys.env</span>
              <ShieldCheck size={10} className="text-emerald-500" />
            </div>
            <button className="w-full py-2 border border-dashed border-zinc-800 rounded-xl text-zinc-600 hover:text-white transition">+ Add</button>
          </div>
        </AppBox>

        {/* 7. PET, CLOCK, NOTES */}
        <AppBox title="Notes" icon={FileText}><textarea className="w-full h-full bg-transparent outline-none resize-none text-xs text-zinc-600" placeholder="Type..." /></AppBox>
        <AppBox title="Mood" icon={Heart} className="flex items-center justify-center text-4xl"><motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity }}>🌵</motion.div></AppBox>
        <AppBox title="Clock" icon={Clock} className="flex items-center justify-center text-3xl font-mono text-white">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </AppBox>

      </div>
    </div>
  );
}
