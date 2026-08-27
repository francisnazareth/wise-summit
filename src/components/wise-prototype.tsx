"use client";

import { useState } from "react";
import {
  Activity, AlertTriangle, ArrowRight, Bot, CalendarDays, Check, ChevronDown,
  CircleDollarSign, Clock3, FileBarChart, Globe2, LayoutDashboard, ListChecks,
  Menu, MessageSquareText, Network, Play, Search, Settings, ShieldAlert, Sparkles,
  Target, Users, WandSparkles, X,
} from "lucide-react";

type Stage = "Overview" | "Strategy" | "Speakers" | "Content" | "Stakeholders" | "Planning" | "Budget" | "Risks" | "Approvals" | "Live Ops" | "Reports";
type AgentStatus = "complete" | "running" | "queued" | "idle";

const nav: Array<[Stage, typeof Activity]> = [
  ["Overview", LayoutDashboard], ["Strategy", Target], ["Speakers", Users], ["Content", MessageSquareText],
  ["Stakeholders", Network], ["Planning", CalendarDays], ["Budget", CircleDollarSign], ["Risks", ShieldAlert],
  ["Approvals", ListChecks], ["Live Ops", Activity], ["Reports", FileBarChart],
];
const themes = ["Innovating Education for a Changing World", "Evidence Into Action", "Human Agency in the Age of AI", "Learning Systems That Adapt"];
const initialAgents: Array<{ name: string; task: string; status: AgentStatus }> = [
  { name: "Strategy Agent", task: "Theme evidence synthesis", status: "complete" },
  { name: "Talent Scout", task: "Global speaker discovery", status: "running" },
  { name: "Outreach Agent", task: "Personalized invitation queue", status: "queued" },
  { name: "Content Curator", task: "Session architecture", status: "running" },
  { name: "Risk Sentinel", task: "Cross-workstream monitoring", status: "complete" },
];
const speakers = [
  { name: "Candidate 024", role: "Minister of Education", region: "MENA", stage: "Confirmed", score: 96 },
  { name: "Candidate 031", role: "Founder, AI Learning Lab", region: "Asia Pacific", stage: "Accepted", score: 94 },
  { name: "Candidate 018", role: "Director, Global Education Fund", region: "Africa", stage: "Invited", score: 91 },
  { name: "Candidate 042", role: "University President", region: "North America", stage: "Identified", score: 88 },
  { name: "Candidate 009", role: "Education Policy Researcher", region: "Europe", stage: "Travel Planned", score: 86 },
  { name: "Candidate 016", role: "Teacher and Social Innovator", region: "Latin America", stage: "Ready", score: 84 },
];
const sessions = [
  { time: "09:00", title: "Opening: Education for a Changing World", track: "Plenary", owner: "Strategy Agent", readiness: 92 },
  { time: "10:15", title: "From Evidence to System Change", track: "Policy", owner: "Content Curator", readiness: 76 },
  { time: "10:15", title: "AI, Teachers, and Human Agency", track: "Innovation", owner: "Content Curator", readiness: 68 },
  { time: "11:30", title: "Scaling What Works Lab", track: "Workshop", owner: "Workshop Agent", readiness: 54 },
];
const profiles = ["Executive Director", "Strategy Lead", "Speaker Lead", "Content Curator", "Operations Lead"];

export function WisePrototype() {
  const [active, setActive] = useState<Stage>("Overview");
  const [role, setRole] = useState(profiles[0]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(themes[0]);
  const [agents, setAgents] = useState(initialAgents);
  const [logs, setLogs] = useState(["Talent Scout ranked 24 education leaders", "Content Curator mapped 4 sessions to system outcomes", "Risk Sentinel cleared policy track dependency"]);
  const [speakerFilter, setSpeakerFilter] = useState("All");
  const [sessionCount, setSessionCount] = useState(4);

  const runAgent = (name: string, result: string) => {
    setAgents(current => current.map(agent => agent.name === name ? { ...agent, status: "complete" } : agent));
    setLogs(current => [result, ...current].slice(0, 5));
  };

  return <div className="prototype-shell">
    <aside className={menuOpen ? "proto-sidebar open" : "proto-sidebar"}>
      <div className="proto-brand"><span>W</span><div><b>WISE Ops</b><small>Agent command</small></div><button onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={18}/></button></div>
      <div className="summit-pill"><i>W</i><div><b>WISE Summit 2026</b><small>42 days to launch · Doha</small></div></div>
      <nav><label>Summit lifecycle</label>{nav.map(([label, Icon], index) => <button key={label} className={active === label ? "active" : ""} onClick={() => { setActive(label); setMenuOpen(false); }}><Icon size={17}/><span>{label}</span>{index > 0 && index < 4 && <em>{index}</em>}</button>)}</nav>
      <div className="proto-user"><span>AM</span><div><b>Avery Morgan</b><small>{role}</small></div><Settings size={16}/></div>
    </aside>

    <div className="proto-main">
      <header className="proto-topbar"><button className="proto-menu" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={19}/></button><div className="proto-search"><Search size={16}/><span>Search the summit operation</span></div><div className="role-switcher"><span>Viewing as</span><select aria-label="Operational profile" value={role} onChange={event => setRole(event.target.value)}>{profiles.map(profile => <option key={profile}>{profile}</option>)}</select><ChevronDown size={14}/></div></header>
      <main className="proto-content">
        <div className="process-rail">{["Strategy", "Speakers", "Content", "Planning", "Execution"].map((step, index) => <button key={step} className={active === step || (active === "Overview" && index === 0) ? "current" : index < 1 ? "done" : ""} onClick={() => index < 3 && setActive(step as Stage)}><span>{index < 1 ? <Check size={13}/> : index + 1}</span><b>{step}</b>{index < 4 && <i/>}</button>)}</div>
        {active === "Overview" && <ExecutiveCenter setActive={setActive}/>} 
        {active === "Strategy" && <StrategyView selectedTheme={selectedTheme} setSelectedTheme={setSelectedTheme} onRun={() => runAgent("Strategy Agent", `Strategy Agent approved “${selectedTheme}” against 6 objectives`)}/>} 
        {active === "Speakers" && <SpeakersView filter={speakerFilter} setFilter={setSpeakerFilter} onRun={() => runAgent("Talent Scout", "Talent Scout added 18 candidates across 7 markets")}/>} 
        {active === "Content" && <ContentView count={sessionCount} onRun={() => { setSessionCount(value => value + 1); runAgent("Content Curator", "Content Curator drafted “From Evidence to Adoption” session"); }}/>} 
        {!(["Overview", "Strategy", "Speakers", "Content"] as Stage[]).includes(active) && <ModuleProfile active={active}/>} 
      </main>
    </div>
    <AgentRail agents={agents} logs={logs}/>
    {menuOpen && <button className="proto-scrim" aria-label="Dismiss menu" onClick={() => setMenuOpen(false)}/>} 
  </div>;
}

function ExecutiveCenter({ setActive }: { setActive: (stage: Stage) => void }) {
  const kpis = [["Timeline readiness", "82%", "+6% this week"], ["Critical path", "3", "1 due today"], ["Speakers ready", "11/18", "4 in outreach"], ["Sessions defined", "14/20", "70% complete"]];
    return <><PageHead eyebrow="Executive command center" title="WISE Summit 2026 Command Center" copy="Live readiness across strategy, global education leaders, content, and summit operations."/><div className="exec-alert"><span/><b>Overall summit health: Strong</b><p>Three agent interventions are running across the critical path.</p><button onClick={() => setActive("Live Ops")}>Open live operations <ArrowRight size={14}/></button></div><section className="exec-kpis">{kpis.map(([label,value,note], index) => <article key={label}><span className={`metric-signal signal-${index}`}/><small>{label}</small><strong>{value}</strong><p>{note}</p></article>)}</section><section className="exec-grid"><article className="proto-panel timeline-panel"><PanelTitle eyebrow="Readiness against timeline" title="Summit critical path"/><div className="timeline-bars">{[["Strategy & theme",94],["Global speakers",72],["Content & sessions",68],["Production & venue",81],["Audience & partners",76]].map(([label,value]) => <div key={label as string}><span><b>{label}</b><em>{value}%</em></span><i><u style={{width:`${value}%`}}/></i></div>)}</div></article><article className="proto-panel stage-panel"><PanelTitle eyebrow="First three stages" title="Action center"/>{[["Strategy", "Theme approved", "94%"],["Speakers", "7 need action", "72%"],["Content", "6 slots open", "68%"]].map(([stage,note,value], index) => <button key={stage} onClick={() => setActive(stage as Stage)}><span>{index+1}</span><div><b>{stage}</b><small>{note}</small></div><strong>{value}</strong><ArrowRight size={16}/></button>)}</article></section></>;
}

function StrategyView({ selectedTheme, setSelectedTheme, onRun }: { selectedTheme: string; setSelectedTheme: (theme: string) => void; onRun: () => void }) {
  return <><PageHead eyebrow="Stage 01 · Strategy" title="Define the summit’s strategic spine." copy="Turn audience signals, WISE values, and market context into a defensible theme." action="Run Strategy Agent" onAction={onRun}/><div className="agent-map"><div className="agent-node central"><Bot size={21}/><b>Strategy Agent</b><small>Orchestrating synthesis</small></div>{[["Audience Research", "12 signals"],["WISE Archive", "5 summits"],["Market Lens", "8 trends"],["Impact Model", "6 outcomes"]].map(([name,note], index) => <div className={`agent-node node-${index}`} key={name}><Sparkles size={16}/><b>{name}</b><small>{note}</small></div>)}</div><section className="strategy-grid"><article className="proto-panel"><PanelTitle eyebrow="Theme candidates" title="Select the narrative direction"/><div className="theme-list">{themes.map((theme,index) => <button className={selectedTheme === theme ? "selected" : ""} key={theme} onClick={() => setSelectedTheme(theme)}><span>{String(index+1).padStart(2,"0")}</span><div><b>{theme}</b><small>{index === 0 ? "Innovation · evidence · global impact" : "Agent-generated strategic territory"}</small></div>{selectedTheme === theme && <Check size={17}/>}</button>)}</div></article><article className="proto-panel rationale"><PanelTitle eyebrow="Agent rationale" title={selectedTheme}/><blockquote>“WISE advances evidence-driven solutions that strengthen learning systems, expand opportunity, and create practical pathways to adoption.”</blockquote><label>Strategic fit <b>96%</b></label><label>Audience resonance <b>91%</b></label><label>Content extensibility <b>88%</b></label><button onClick={onRun}><Check size={16}/> Approve strategic direction</button></article></section></>;
}

function SpeakersView({ filter, setFilter, onRun }: { filter: string; setFilter: (value:string)=>void; onRun:()=>void }) {
  const stages = ["Identified","Invited","Accepted","Confirmed","Travel Planned","Ready"];
  return <><PageHead eyebrow="Stage 02 · Global speakers" title="Build the voices behind the theme." copy="Discover, score, engage, confirm, and prepare speakers with agent-supported handoffs." action="Run global discovery" onAction={onRun}/><div className="speaker-toolbar"><div>{["All","MENA","Africa","Asia Pacific"].map(region => <button className={filter===region?"active":""} key={region} onClick={()=>setFilter(region)}>{region}</button>)}</div><span><Globe2 size={15}/> 7 markets · 24 candidates</span></div><section className="speaker-pipeline">{stages.map(stage => { const matches=speakers.filter(speaker => speaker.stage===stage && (filter==="All"||speaker.region===filter)); return <div className="pipeline-column" key={stage}><header><b>{stage}</b><span>{matches.length}</span></header>{matches.map(speaker => <article key={speaker.name}><div><span>{speaker.name.split(" ").map(part=>part[0]).join("")}</span><em>{speaker.score}% fit</em></div><b>{speaker.name}</b><p>{speaker.role}</p><small>{speaker.region}</small><footer><i className={stage==="Ready"?"ready":""}/>{stage==="Identified"?"Agent ranked":"Human reviewed"}</footer></article>)}</div>;})}</section></>;
}

function ContentView({ count, onRun }: { count:number; onRun:()=>void }) {
  return <><PageHead eyebrow="Stage 03 · Content curation" title="Shape ideas into a coherent summit." copy="Translate strategy and speaker expertise into sessions, tracks, and measurable audience outcomes." action="Generate session" onAction={onRun}/><section className="content-stats"><article><small>Sessions defined</small><strong>{count}/20</strong></article><article><small>Speakers assigned</small><strong>11/18</strong></article><article><small>Learning outcomes</small><strong>86%</strong></article><article><small>Editorial ready</small><strong>9</strong></article></section><section className="agenda-layout"><article className="proto-panel agenda"><PanelTitle eyebrow="Agenda builder" title="Summit day architecture"/>{sessions.map(session => <div className="session-row" key={session.title}><time>{session.time}</time><span className={`track ${session.track.toLowerCase().replace(" ","-")}`}/><div><b>{session.title}</b><small>{session.track} · {session.owner}</small></div><em>{session.readiness}%</em><button aria-label={`Open ${session.title}`}><ArrowRight size={15}/></button></div>)}{count>4&&<div className="session-row generated"><time>13:30</time><span className="track venture"/><div><b>From Evidence to Adoption</b><small>Policy · Content Curator</small></div><em>Draft</em><button><ArrowRight size={15}/></button></div>}</article><article className="proto-panel curator-panel"><PanelTitle eyebrow="Curation intelligence" title="Coverage against strategy"/>{[["Evidence to adoption",88],["Policy & coalitions",74],["Innovation at scale",92],["Equity & opportunity",81]].map(([label,value]) => <div className="coverage" key={label as string}><span><b>{label}</b><em>{value}%</em></span><i><u style={{width:`${value}%`}}/></i></div>)}<div className="agent-recommendation"><Sparkles size={18}/><p><b>Content gap detected</b>Add one session connecting evidence, policy, and practical adoption.</p><button onClick={onRun}>Apply recommendation</button></div></article></section></>;
}

function ModuleProfile({ active }: { active: Stage }) {
  const data: Record<string,[string,string,string][]> = { Stakeholders:[["Active relationships","148","12 need follow-up"],["Sponsors","8","2 pending assets"],["VIPs","24","91% confirmed"]], Planning:[["Milestones","36","29 on track"],["Open tasks","47","8 overdue"],["Critical path","3","1 due today"]], Budget:[["Approved","$270k","FY26 allocation"],["Committed","$184k","68% utilized"],["Variance","+$8.4k","Production watch"]], Risks:[["Open risks","6","2 high impact"],["Mitigated","18","This cycle"],["Agent flags","3","Need owner action"]], Approvals:[["Pending","7","3 due today"],["Approved","42","This cycle"],["Avg. cycle","1.8d","-0.4d trend"]], "Live Ops":[["Workstreams","9","7 green"],["Agent runs","12","5 active"],["Escalations","3","1 executive"]], Reports:[["Executive briefs","6","Latest today"],["Data sources","14","All synchronized"],["Exports","28","This month"]] };
  return <><PageHead eyebrow="Operational module" title={active} copy={`High-level ${active.toLowerCase()} profile with shared progress and agent observability.`}/><section className="module-cards">{(data[active]||[]).map(([label,value,note])=><article key={label}><small>{label}</small><strong>{value}</strong><p>{note}</p></article>)}</section><article className="proto-panel module-placeholder"><Network size={30}/><h2>{active} workspace</h2><p>This module is connected to the shared summit graph. Agent outputs, approvals, and exceptions from the first three stages appear here automatically.</p><button>Open module profile <ArrowRight size={15}/></button></article></>;
}

function AgentRail({ agents, logs }: { agents: typeof initialAgents; logs: string[] }) { return <aside className="agent-rail"><header><span><Activity size={17}/></span><div><b>Agent observability</b><small>5 agents · 2 running</small></div><i/></header><section><label>Orchestration graph</label>{agents.map(agent=><div className="agent-run" key={agent.name}><span className={agent.status}/><div><b>{agent.name}</b><small>{agent.task}</small></div><em>{agent.status}</em></div>)}</section><section className="run-log"><label>Live trace</label>{logs.map((log,index)=><div key={log}><time>{index===0?"now":`${index*4}m`}</time><p>{log}</p></div>)}</section><footer><Clock3 size={14}/> Last synchronized just now</footer></aside>; }
function PageHead({eyebrow,title,copy,action,onAction}:{eyebrow:string;title:string;copy:string;action?:string;onAction?:()=>void}) { return <div className="proto-heading"><div><span>{eyebrow}</span><h1>{title}</h1><p>{copy}</p></div>{action&&<button onClick={onAction}><Play size={15}/>{action}</button>}</div>; }
function PanelTitle({eyebrow,title}:{eyebrow:string;title:string}) { return <div className="proto-panel-title"><span>{eyebrow}</span><h2>{title}</h2></div>; }
