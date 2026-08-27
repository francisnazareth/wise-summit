"use client";

import { useState } from "react";
import { Activity, AlertTriangle, ArrowUpRight, Bell, Bot, CalendarDays, CheckCircle2, ChevronDown, CircleDollarSign, FileBarChart, Handshake, LayoutDashboard, Menu, MessageSquareText, Moon, MoreHorizontal, Plus, Search, Settings, ShieldAlert, Sparkles, Sun, Target, Users, WandSparkles, X } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const navigation = [
  ["Overview", LayoutDashboard], ["Program", CalendarDays], ["Stakeholders", Users], ["Speakers", MessageSquareText], ["Planning", Target], ["Budget", CircleDollarSign], ["Risks", ShieldAlert], ["Approvals", CheckCircle2], ["Live operations", Activity], ["Reports", FileBarChart],
] as const;
const registrations = [
  { week: "Jan 12", actual: 180, target: 210 }, { week: "Jan 26", actual: 318, target: 340 }, { week: "Feb 09", actual: 494, target: 470 }, { week: "Feb 23", actual: 678, target: 620 }, { week: "Mar 09", actual: 842, target: 770 }, { week: "Mar 23", actual: 1018, target: 940 }, { week: "Apr 06", actual: 1184, target: 1100 },
];
const metrics = [
  ["Days to summit", "42", "May 23, 2026", CalendarDays, "lime"], ["Program health", "86%", "+4% this week", Activity, "coral"], ["Registrations", "1,184", "92% of target", Users, "blue"], ["Budget used", "$184k", "68% of $270k", CircleDollarSign, "gold"],
] as const;
const readiness = [["Program & content", 92], ["Speaker logistics", 78], ["Venue & production", 84], ["Partners & sponsors", 66]] as const;
const updates = [["AS", "Alex confirmed Suzanne Abair’s green room brief", "12 min", "coral"], ["JM", "Jules approved the stage production change order", "38 min", "blue"], ["NK", "Nia added 42 waitlist registrations", "1 hr", "lime"], ["TV", "Taylor flagged sponsor signage as at risk", "2 hr", "gold"]] as const;

export function WiseDashboard() {
  const [active, setActive] = useState("Overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [assistant, setAssistant] = useState(false);
  return <div className={dark ? "app dark" : "app"}>
    <aside className={menuOpen ? "sidebar open" : "sidebar"}>
      <div className="brand-row"><div className="brand-mark">W</div><div><strong>WISE Ops</strong><span>Summit 2026</span></div><button className="icon-button mobile-only" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X size={18}/></button></div>
      <div className="program-switcher"><span className="program-art">GTG</span><span><b>Good to Grow</b><small>Active program</small></span><ChevronDown size={16}/></div>
      <nav><span className="nav-label">Workspace</span>{navigation.map(([label, Icon]) => <button key={label} className={active === label ? "nav-item active" : "nav-item"} onClick={() => { setActive(label); setMenuOpen(false); }}><Icon size={18}/><span>{label}</span>{label === "Risks" && <em>6</em>}</button>)}</nav>
      <div className="sidebar-bottom"><button className="nav-item"><Settings size={18}/><span>Settings</span></button><div className="user-card"><span className="avatar">AM</span><span><b>Avery Morgan</b><small>Program director</small></span><MoreHorizontal size={17}/></div></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><button className="icon-button menu-button" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu size={20}/></button><div className="search-box"><Search size={17}/><input aria-label="Search" placeholder="Search speakers, tasks, risks..."/><kbd>⌘ K</kbd></div><div className="top-actions"><button className="icon-button" onClick={() => setDark(!dark)} aria-label="Toggle theme">{dark ? <Sun size={18}/> : <Moon size={18}/>}</button><button className="icon-button notification" aria-label="Notifications"><Bell size={18}/><i/></button><button className="assistant-button" onClick={() => setAssistant(true)}><Sparkles size={16}/> Ask WISE AI</button></div></header>
      <main className="content">
        <section className="page-heading"><div><span className="eyebrow">Thursday, April 11</span><h1>Good morning, Avery.</h1><p>Here’s what needs attention across WISE Summit today.</p></div><div className="heading-actions"><button className="secondary-button"><FileBarChart size={17}/> Export brief</button><button className="primary-button"><Plus size={17}/> Create</button></div></section>
        <section className="status-strip"><span className="pulse-dot"/><b>Summit health is strong</b><span>4 workstreams need attention before Friday’s steering review.</span><button>View action plan <ArrowUpRight size={14}/></button></section>
        <section className="kpi-grid">{metrics.map(([label,value,note,Icon,tone]) => <article className="kpi-card" key={label}><span className={`kpi-icon ${tone}`}><Icon size={20}/></span><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>)}</section>
        <section className="dashboard-grid">
          <article className="panel chart-panel"><Heading kicker="Audience" title="Registration momentum"><button className="select-button">Last 12 weeks <ChevronDown size={14}/></button></Heading><div className="chart-summary"><strong>+18.4%</strong><span>ahead of the same point last year</span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={registrations} margin={{top:10,right:8,left:-22,bottom:0}}><defs><linearGradient id="regFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff6b4a" stopOpacity={.32}/><stop offset="100%" stopColor="#ff6b4a" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)"/><XAxis dataKey="week" tickLine={false} axisLine={false} tick={{fill:"var(--muted)",fontSize:11}}/><YAxis tickLine={false} axisLine={false} tick={{fill:"var(--muted)",fontSize:11}}/><Tooltip contentStyle={{borderRadius:6,border:"1px solid var(--line)",background:"var(--panel)",color:"var(--text)"}}/><Area type="monotone" dataKey="target" stroke="#8a8d83" strokeDasharray="5 5" fill="transparent"/><Area type="monotone" dataKey="actual" stroke="#ff6b4a" strokeWidth={3} fill="url(#regFill)"/></AreaChart></ResponsiveContainer></div></article>
          <article className="panel readiness-panel"><Heading kicker="Readiness" title="Workstream health"><button className="text-button">View all</button></Heading><div className="readiness-list">{readiness.map(([label,value]) => <div className="readiness-row" key={label}><div><b>{label}</b><span className={value < 70 ? "risk" : value < 80 ? "watch" : "good"}>{value < 70 ? "Needs focus" : value < 80 ? "Watch" : "On track"}</span></div><div className="progress-track"><i style={{width:`${value}%`}}/></div><strong>{value}%</strong></div>)}</div><button className="panel-cta"><WandSparkles size={17}/> Generate recovery plan</button></article>
          <article className="panel attention-panel"><Heading kicker="Priority queue" title="Needs your attention"><span className="count-badge">4 open</span></Heading><div className="attention-list"><Attention icon={AlertTriangle} tone="critical" title="Approve AV production overage" meta="Budget · Due today" value="$12,400"/><Attention icon={Handshake} tone="warning" title="Bank of America sponsor assets" meta="Partnerships · 2 days late" value="Waiting"/><Attention icon={Users} tone="neutral" title="Finalize keynote travel" meta="Speakers · Due tomorrow" value="2 guests"/></div></article>
          <article className="panel activity-panel"><Heading kicker="Live updates" title="Team activity"><button className="icon-button"><MoreHorizontal size={18}/></button></Heading><div className="activity-list">{updates.map(([initials,text,time,color]) => <div className="activity-row" key={text}><span className={`avatar ${color}`}>{initials}</span><p>{text}<small>{time} ago</small></p></div>)}</div></article>
        </section>
      </main>
    </div>
    {menuOpen && <button className="scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)}/>} {assistant && <button className="scrim assistant-scrim" aria-label="Close assistant" onClick={() => setAssistant(false)}/>}<aside className={assistant ? "assistant-panel open" : "assistant-panel"}><div className="assistant-header"><span className="ai-mark"><Bot size={20}/></span><div><b>WISE AI</b><small>Program copilot</small></div><button className="icon-button" onClick={() => setAssistant(false)}><X size={19}/></button></div><div className="assistant-body"><div className="ai-intro"><Sparkles size={24}/><h2>What should we move forward?</h2><p>I can synthesize your summit data into plans, briefs, and recommendations.</p></div><div className="prompt-grid">{["Generate today’s action plan","Draft the steering brief","Review open risks","Recommend speaker pairings"].map(prompt => <button key={prompt}>{prompt}<ArrowUpRight size={15}/></button>)}</div></div><div className="assistant-input"><textarea aria-label="Message WISE AI" placeholder="Ask about the program..."/><button><ArrowUpRight size={18}/></button></div></aside>
  </div>;
}

function Heading({kicker,title,children}:{kicker:string;title:string;children:React.ReactNode}) { return <div className="panel-heading"><div><span className="section-kicker">{kicker}</span><h2>{title}</h2></div>{children}</div>; }
function Attention({icon:Icon,tone,title,meta,value}:{icon:typeof AlertTriangle;tone:string;title:string;meta:string;value:string}) { return <button><span className={`priority ${tone}`}><Icon size={17}/></span><span><b>{title}</b><small>{meta}</small></span><strong>{value}</strong><ArrowUpRight size={16}/></button>; }
