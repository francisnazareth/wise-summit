"use client";

import { useEffect, useState } from "react";
import {
  Activity, AlertTriangle, ArrowLeft, ArrowRight, Bot, CalendarDays, Check, ChevronDown,
  CircleDollarSign, Clock3, FileBarChart, Globe2, LayoutDashboard, ListChecks,
  LogIn, LogOut, Menu, MessageSquareText, Network, Play, Plus, Search, ShieldAlert, Sparkles,
  Target, Users, WandSparkles, X,
} from "lucide-react";
import { LiveOperationsView, ReportsView, RiskView, TimelineView } from "./operational-views";
import { ProgramBuilder } from "./program-builder";

type Stage = "Overview" | "Programs" | "Strategy" | "Speakers" | "Content" | "Stakeholders" | "Planning" | "Budget" | "Risks" | "Approvals" | "Live Ops" | "Reports";
type AgentStatus = "complete" | "running" | "queued" | "idle";
type SpeakerStage = "Identified" | "Invited" | "Accepted" | "Confirmed" | "Travel Planned" | "Ready";
type SpeakerRecord = { name: string; role: string; region: string; stage: SpeakerStage; score: number; sourceUrl?: string };
type DiscoveredSpeaker = { name: string; role: string; region: "USA" | "Europe" | "Africa" | "Asia"; score: number; source_url: string };
type SessionTopic = { id: string; title: string; track: string; description?: string; speaker?: string; time?: string; location?: string };
type SessionIdea = { title: string; description: string; track: string };
type ProgramRecord = { name: string; theme: string; location: string; attendees: string; speakers: string; budget: string; narrative: string; status: "Active" | "Planning" };
type StrategyCandidate = { theme: string; territory: string };
type StrategyOutput = {
  candidates: StrategyCandidate[];
  recommendedTheme: string;
  rationale: string;
  strategicFit: number;
  audienceResonance: number;
  contentExtensibility: number;
  trace: string[];
};

const strategyApiUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://app-wise-demo-api-58de9d.azurewebsites.net";

const nav: Array<[Stage, typeof Activity]> = [
  ["Overview", LayoutDashboard], ["Programs", CalendarDays], ["Strategy", Target], ["Speakers", Users], ["Content", MessageSquareText],
  ["Stakeholders", Network], ["Planning", CalendarDays], ["Budget", CircleDollarSign], ["Risks", ShieldAlert],
  ["Approvals", ListChecks], ["Live Ops", Activity], ["Reports", FileBarChart],
];
const themes = ["Learning to Flourish", "Innovating Education for a Changing World", "Evidence Into Action", "Human Agency in the Age of AI", "Learning Systems That Adapt"];
const initialStrategyOutput: StrategyOutput = {
  candidates: themes.map((theme, index) => ({
    theme,
    territory: index === 0 ? "Innovation · evidence · global impact" : "Agent-generated strategic territory",
  })),
  recommendedTheme: themes[0],
  rationale: "WISE advances evidence-driven solutions that strengthen learning systems, expand opportunity, and create practical pathways to adoption.",
  strategicFit: 96,
  audienceResonance: 91,
  contentExtensibility: 88,
  trace: [],
};

function parseStrategyOutput(message: string): StrategyOutput {
  const firstBrace = message.indexOf("{");
  const lastBrace = message.lastIndexOf("}");
  if (firstBrace < 0 || lastBrace <= firstBrace) throw new Error("The model did not return strategy JSON.");

  const output = JSON.parse(message.slice(firstBrace, lastBrace + 1)) as StrategyOutput;
  if (!Array.isArray(output.candidates) || output.candidates.length === 0 || !output.recommendedTheme || !output.rationale) {
    throw new Error("The model returned an incomplete strategy.");
  }
  return output;
}
const initialAgents: Array<{ name: string; task: string; status: AgentStatus }> = [
  { name: "Strategy Agent", task: "Theme evidence synthesis", status: "complete" },
  { name: "Talent Scout", task: "Ready for global speaker discovery", status: "idle" },
  { name: "Outreach Agent", task: "Personalized invitation queue", status: "queued" },
  { name: "Content Curator", task: "Ready to generate session ideas", status: "idle" },
  { name: "Risk Sentinel", task: "Cross-workstream monitoring", status: "complete" },
];
const speakerStages: SpeakerStage[] = ["Identified", "Invited", "Accepted", "Confirmed", "Travel Planned", "Ready"];
const speakers: SpeakerRecord[] = [
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
type ProgrammeSession = { title: string; track: string; owner: string; status: string };
type ProgrammeRow = { label: string; time: string; type: "plenary" | "break" | "slot"; sessions?: ProgrammeSession[] };
const programmeLocations = ["Auditorium", "Learning Lab", "Policy Studio", "Agora", "Majlis", "Partner Hub"];
const programmeRows: ProgrammeRow[] = [
  { label: "Plenary", time: "09:00–10:00", type: "plenary", sessions: [{ title: "Opening Plenary: Education for a Changing World", track: "Plenary", owner: "Strategy Agent", status: "Editorial ready" }] },
  { label: "Break", time: "10:00–10:30", type: "break" },
  { label: "Slot 1", time: "10:30–11:15", type: "slot", sessions: [
    { title: "From Evidence to System Change", track: "Policy", owner: "Content Curator", status: "Speakers confirmed" },
    { title: "AI, Teachers and Human Agency", track: "Innovation", owner: "Content Curator", status: "Editorial review" },
    { title: "The New Geography of Learning", track: "Global outlook", owner: "Strategy Agent", status: "Editorial ready" },
    { title: "Youth Voices on the Future", track: "Roundtable", owner: "Youth Council", status: "Speakers confirmed" },
    { title: "Building Learning Ecosystems", track: "Workshop", owner: "Workshop Agent", status: "In development" },
    { title: "Partner Solutions Exchange", track: "Partner session", owner: "Partnerships", status: "Editorial review" },
  ] },
  { label: "Break", time: "11:15–11:30", type: "break" },
  { label: "Slot 2", time: "11:30–12:15", type: "slot", sessions: [
    { title: "Financing Education Transformation", track: "Policy", owner: "Content Curator", status: "Speakers confirmed" },
    { title: "Scaling What Works Lab", track: "Workshop", owner: "Workshop Agent", status: "In development" },
    { title: "Learning Systems That Adapt", track: "Systems", owner: "Strategy Agent", status: "Editorial ready" },
    { title: "Teacher Leadership Circle", track: "Roundtable", owner: "Content Curator", status: "Editorial review" },
    { title: "Designing for Neurodiversity", track: "Workshop", owner: "Workshop Agent", status: "Speakers confirmed" },
    { title: "EdTech Evidence Clinic", track: "Partner session", owner: "Partnerships", status: "In development" },
  ] },
  { label: "Lunch", time: "12:15–13:15", type: "break" },
  { label: "Slot 3", time: "13:15–14:00", type: "slot", sessions: [
    { title: "Education in an Age of Uncertainty", track: "Global outlook", owner: "Strategy Agent", status: "Editorial ready" },
    { title: "AI Literacy for Every Learner", track: "Innovation", owner: "Content Curator", status: "Speakers confirmed" },
    { title: "Evidence Into Action", track: "Policy", owner: "Content Curator", status: "Editorial review" },
    { title: "Student Agency in Practice", track: "Roundtable", owner: "Youth Council", status: "In development" },
    { title: "Rapid Prototyping Studio", track: "Workshop", owner: "Workshop Agent", status: "Speakers confirmed" },
    { title: "Innovation Showcase", track: "Partner session", owner: "Partnerships", status: "Editorial ready" },
  ] },
  { label: "Break", time: "14:00–14:20", type: "break" },
  { label: "Slot 4", time: "14:20–15:05", type: "slot", sessions: [
    { title: "A New Social Contract for Learning", track: "Policy", owner: "Content Curator", status: "Editorial review" },
    { title: "Responsible AI by Design", track: "Innovation", owner: "Content Curator", status: "Editorial ready" },
    { title: "Measuring What Matters", track: "Evidence", owner: "Strategy Agent", status: "Speakers confirmed" },
    { title: "Ministerial Exchange", track: "Roundtable", owner: "Speaker Lead", status: "Invite in progress" },
    { title: "Coalition Building Lab", track: "Workshop", owner: "Workshop Agent", status: "In development" },
    { title: "Future Skills Exchange", track: "Partner session", owner: "Partnerships", status: "Speakers confirmed" },
  ] },
  { label: "Break", time: "15:05–15:25", type: "break" },
  { label: "Slot 5", time: "15:25–16:10", type: "slot", sessions: [
    { title: "The Policy Adoption Playbook", track: "Policy", owner: "Content Curator", status: "In development" },
    { title: "Human-Centered Learning Futures", track: "Innovation", owner: "Content Curator", status: "Editorial review" },
    { title: "Leading System Transformation", track: "Leadership", owner: "Strategy Agent", status: "Speakers confirmed" },
    { title: "Community-Led Innovation", track: "Roundtable", owner: "Youth Council", status: "Editorial ready" },
    { title: "Foresight Methods Lab", track: "Workshop", owner: "Workshop Agent", status: "In development" },
    { title: "From Pilot to Scale", track: "Partner session", owner: "Partnerships", status: "Editorial review" },
  ] },
  { label: "Plenary", time: "16:20–17:00", type: "plenary", sessions: [{ title: "Closing Plenary: Commitments for 2027", track: "Plenary", owner: "Strategy Agent", status: "Editorial review" }] },
];
const profiles = ["Executive Director", "Strategy Lead", "Speaker Lead", "Content Curator", "Operations Lead"];
const initialPrograms: ProgramRecord[] = [{ name: "WISE Summit 2027", theme: "Innovating Education for a Changing World", location: "Doha", attendees: "3,000", speakers: "150", budget: "$5M", narrative: "A global operating environment for summit strategy, content, and delivery.", status: "Active" }];

export function WisePrototype() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [active, setActive] = useState<Stage>("Overview");
  const [role, setRole] = useState(profiles[0]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(themes[0]);
  const [agents, setAgents] = useState(initialAgents);
  const [logs, setLogs] = useState(["Talent Scout ranked 24 education leaders", "Content Curator mapped 4 sessions to system outcomes", "Risk Sentinel cleared policy track dependency"]);
  const [speakerFilter, setSpeakerFilter] = useState("All");
  const [sessionCount] = useState(4);
  const [speakerRecords, setSpeakerRecords] = useState(speakers);
  const [sessionTopics, setSessionTopics] = useState<SessionTopic[]>([]);
  const [sessionIdeas, setSessionIdeas] = useState<SessionIdea[]>([]);
  const [programs, setPrograms] = useState(initialPrograms);
  const [strategyOutput, setStrategyOutput] = useState(initialStrategyOutput);
  const [strategyError, setStrategyError] = useState("");
  const [speakerError, setSpeakerError] = useState("");
  const [sessionError, setSessionError] = useState("");

  const showDiscoveredSpeakers = (candidates: DiscoveredSpeaker[]) => {
    setSpeakerRecords(candidates.map(candidate => ({
      name: candidate.name,
      role: candidate.role,
      region: candidate.region,
      score: candidate.score,
      sourceUrl: candidate.source_url,
      stage: "Identified",
    })));
    setSpeakerFilter("All");
    setAgents(current => current.map(agent => agent.name === "Talent Scout" ? { ...agent, status: "complete", task: `${candidates.length} web-grounded candidates found` } : agent));
  };

  useEffect(() => {
    if (active !== "Speakers") return;

    const loadCachedSpeakers = async () => {
      try {
        const response = await fetch(`${strategyApiUrl}/api/speakers`);
        if (response.status === 404) return;
        const payload = await response.json() as { candidates?: DiscoveredSpeaker[] };
        if (response.ok && payload.candidates) showDiscoveredSpeakers(payload.candidates);
      } catch {
        // The discovery button remains available when no cached session can be loaded.
      }
    };

    void loadCachedSpeakers();
  }, [active]);

  const runStrategyAgent = async () => {
    if (agents.find(agent => agent.name === "Strategy Agent")?.status === "running") return;

    setStrategyError("");
    setAgents(current => current.map(agent => agent.name === "Strategy Agent" ? { ...agent, status: "running", task: "Synthesizing live summit signals" } : agent));
    setLogs(current => ["Strategy Agent started audience, archive, market, and impact synthesis", ...current].slice(0, 8));

    const prompt = `You are the WISE Summit Strategy Agent. Create a fresh strategic direction for WISE Summit 2027 in Doha. The summit should advance global education through evidence, innovation, human agency, and practical impact. Return JSON only with this exact shape: {"candidates":[{"theme":"short theme title","territory":"short strategic territory"}],"recommendedTheme":"one candidate theme","rationale":"a concise two-sentence strategy suitable for leadership","strategicFit":95,"audienceResonance":90,"contentExtensibility":88,"trace":["short synthesis step","short synthesis step","short synthesis step"]}. Include exactly four distinct candidates. Scores must be integers from 0 to 100. Do not reuse the current theme "${selectedTheme}".`;

    try {
      const response = await fetch(`${strategyApiUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });
      const payload = await response.json() as { message?: string; detail?: string };
      if (!response.ok || !payload.message) throw new Error(payload.detail ?? "The Strategy Agent did not return a result.");

      const output = parseStrategyOutput(payload.message);
      setStrategyOutput(output);
      setSelectedTheme(output.recommendedTheme);
      setAgents(current => current.map(agent => agent.name === "Strategy Agent" ? { ...agent, status: "complete", task: `${output.candidates.length} strategic themes generated` } : agent));
      setLogs(current => [
        `Strategy Agent recommends “${output.recommendedTheme}”`,
        ...output.trace.map(step => `Strategy trace · ${step}`),
        ...current,
      ].slice(0, 8));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Strategy generation failed.";
      setStrategyError(message);
      setAgents(current => current.map(agent => agent.name === "Strategy Agent" ? { ...agent, status: "idle", task: "Generation failed · ready to retry" } : agent));
      setLogs(current => [`Strategy Agent failed · ${message}`, ...current].slice(0, 8));
    }
  };

  const runGlobalDiscovery = async () => {
    if (agents.find(agent => agent.name === "Talent Scout")?.status === "running") return;

    setSpeakerError("");
    setAgents(current => current.map(agent => agent.name === "Talent Scout" ? { ...agent, status: "running", task: "Searching the public web across four regions" } : agent));
    setLogs(current => ["Talent Scout started global web discovery · USA 30 · Europe 20 · Africa 20 · Asia 30", ...current].slice(0, 8));

    try {
      const response = await fetch(`${strategyApiUrl}/api/speakers/discover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: selectedTheme }),
      });
      const payload = await response.json() as { candidates?: DiscoveredSpeaker[]; detail?: string };
      if (!response.ok || !payload.candidates) throw new Error(payload.detail ?? "Global discovery did not return candidates.");
      const candidates = payload.candidates;

      showDiscoveredSpeakers(candidates);
      setLogs(current => [`Talent Scout found ${candidates.length} candidates with a 30 · 20 · 20 · 30 regional split`, ...current].slice(0, 8));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Global discovery failed.";
      setSpeakerError(message);
      setAgents(current => current.map(agent => agent.name === "Talent Scout" ? { ...agent, status: "idle", task: "Discovery failed · ready to retry" } : agent));
      setLogs(current => [`Talent Scout failed · ${message}`, ...current].slice(0, 8));
    }
  };

  const runSessionGeneration = async () => {
    if (agents.find(agent => agent.name === "Content Curator")?.status === "running") return;

    setSessionError("");
    setSessionIdeas([]);
    setAgents(current => current.map(agent => agent.name === "Content Curator" ? { ...agent, status: "running", task: "Generating four editorial idea batches" } : agent));
    setLogs(current => ["Content Curator started generating 100 session ideas", ...current].slice(0, 8));

    try {
      const response = await fetch(`${strategyApiUrl}/api/sessions/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: selectedTheme }),
      });
      const payload = await response.json() as { sessions?: SessionIdea[]; detail?: string };
      if (!response.ok || !payload.sessions) throw new Error(payload.detail ?? "Session generation did not return ideas.");

      setSessionIdeas(payload.sessions);
      setAgents(current => current.map(agent => agent.name === "Content Curator" ? { ...agent, status: "complete", task: `${payload.sessions?.length ?? 0} session ideas generated` } : agent));
      setLogs(current => [`Content Curator generated ${payload.sessions?.length ?? 0} session ideas for “${selectedTheme}”`, ...current].slice(0, 8));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Session generation failed.";
      setSessionError(message);
      setAgents(current => current.map(agent => agent.name === "Content Curator" ? { ...agent, status: "idle", task: "Generation failed · ready to retry" } : agent));
      setLogs(current => [`Content Curator failed · ${message}`, ...current].slice(0, 8));
    }
  };

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setLoginError("Enter an email and password to continue.");
      return;
    }
    setLoginError("");
    setLoggedIn(true);
  };

  const goHome = () => {
    setActive("Overview");
    setMenuOpen(false);
  };

  return <><div className={loggedIn ? "prototype-shell" : "prototype-shell auth-locked"} aria-hidden={!loggedIn}>
    <aside className={menuOpen ? "proto-sidebar open" : "proto-sidebar"}>
      <div className="proto-brand"><button className="brand-home" onClick={goHome} aria-label="Go to home screen"><img src="/images/logo.webp" alt="Qatar Foundation and WISE"/></button><div/><button onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={18}/></button></div>
      <div className="summit-pill"><i>W</i><div><b>WISE Summit 2027</b><small>15 April 2027 · Doha</small></div></div>
      <nav><label>Summit lifecycle</label>{nav.map(([label, Icon], index) => <button key={label} className={active === label ? "active" : ""} onClick={() => { setActive(label); setMenuOpen(false); }}><Icon size={17}/><span>{label}</span>{index > 0 && index < 4 && <em>{index}</em>}</button>)}</nav>
      <div className="proto-user"><span>AM</span><div><b>Avery Morgan</b><small>{role}</small></div><button aria-label="Sign out" title="Sign out" onClick={() => setLoggedIn(false)}><LogOut size={16}/></button></div>
    </aside>

    <div className="proto-main">
      <header className="proto-topbar"><button className="proto-menu" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={19}/></button><div className="proto-search"><Search size={16}/><span>Search the summit operation</span></div><div className="role-switcher"><span>Viewing as</span><select aria-label="Operational profile" value={role} onChange={event => setRole(event.target.value)}>{profiles.map(profile => <option key={profile}>{profile}</option>)}</select><ChevronDown size={14}/></div></header>
      <main className="proto-content">
        <div className="process-rail">{["Strategy", "Speakers", "Content", "Planning", "Execution"].map((step, index) => <button key={step} className={active === step || (active === "Overview" && index === 0) ? "current" : index < 1 ? "done" : ""} onClick={() => index < 3 && setActive(step as Stage)}><span>{index < 1 ? <Check size={13}/> : index + 1}</span><b>{step}</b>{index < 4 && <i/>}</button>)}</div>
        {active === "Overview" && <ExecutiveCenter setActive={setActive}/>} 
        {active === "Programs" && <ProgramsView programs={programs} onCreate={program => { setPrograms(current => [...current.filter(item => item.name !== program.name), program]); setLogs(current => [`Program Agent created ${program.name} operating environment`, ...current].slice(0, 5)); }}/>} 
        {active === "Strategy" && (
          <StrategyView output={strategyOutput} selectedTheme={selectedTheme} setSelectedTheme={setSelectedTheme} status={agents.find(agent => agent.name === "Strategy Agent")?.status ?? "idle"} error={strategyError} onRun={runStrategyAgent} onApprove={() => setActive("Speakers")}/>
        )}
        {active === "Speakers" && (
          <SpeakersView speakers={speakerRecords} filter={speakerFilter} setFilter={setSpeakerFilter} status={agents.find(agent => agent.name === "Talent Scout")?.status ?? "idle"} error={speakerError} onStageChange={(name, stage) => { setSpeakerRecords(current => current.map(speaker => speaker.name === name ? { ...speaker, stage } : speaker)); setLogs(current => [`Speaker Lead moved ${name} to ${stage}`, ...current].slice(0, 5)); }} onRun={runGlobalDiscovery}/>
        )}
        {active === "Content" && <ContentView count={sessionCount} speakers={speakerRecords} topics={sessionTopics} setTopics={setSessionTopics} onRun={runSessionGeneration}/>}
        {active === "Content" && <SessionIdeaLibrary ideas={sessionIdeas} status={agents.find(agent => agent.name === "Content Curator")?.status ?? "idle"} error={sessionError} onRetry={runSessionGeneration} onAdd={idea => setSessionTopics(current => current.some(topic => topic.title === idea.title) ? current : [...current, { ...idea, id: `topic-${Date.now()}` }])}/>}
        {active === "Content" && <ProgramBuilder/>}
        {active === "Planning" && <TimelineView/>}
        {active === "Risks" && <RiskView/>}
        {active === "Live Ops" && <LiveOperationsView/>}
        {active === "Reports" && <ReportsView/>}
        {!(["Overview", "Programs", "Strategy", "Speakers", "Content", "Planning", "Risks", "Live Ops", "Reports"] as Stage[]).includes(active) && <ModuleProfile active={active}/>}
      </main>
    </div>
    <AgentRail agents={agents} logs={logs}/>
    {menuOpen && <button className="proto-scrim" aria-label="Dismiss menu" onClick={() => setMenuOpen(false)}/>} 
  </div>{!loggedIn&&<div className="login-backdrop"><section className="login-dialog" role="dialog" aria-modal="true" aria-labelledby="login-title"><button className="login-logo" onClick={goHome} aria-label="Go to home screen"><img src="/images/logo.webp" alt="Qatar Foundation and WISE"/></button><span>WISE Summit 2027</span><h1 id="login-title">Command Center</h1><p>Sign in to monitor summit health, programme readiness, and agent activity.</p><form onSubmit={handleLogin}><label>Email address<input type="email" value={loginEmail} onChange={event=>setLoginEmail(event.target.value)} placeholder="name@wise.org" autoComplete="email" autoFocus/></label><label>Password<input type="password" value={loginPassword} onChange={event=>setLoginPassword(event.target.value)} placeholder="Enter any password" autoComplete="current-password"/></label>{loginError&&<div className="login-error" role="alert">{loginError}</div>}<button type="submit"><LogIn size={16}/>Sign in</button></form><small>Demo access</small></section></div>}</>;
}

function ExecutiveCenter({ setActive }: { setActive: (stage: Stage) => void }) {
  const kpis = [["Summit Health Score", "82%", "+6% this week"], ["Days to Event", "231", "15 Apr 2027 · Doha"], ["Budget", "$270k", "68% committed"], ["Sponsors", "8", "2 pending assets"], ["Speakers", "11/18", "4 in outreach"], ["Risks", "6", "2 high impact"]];
    return <><section className="executive-hero"><div><span>Executive command center</span><h1>WISE Summit 2027<br/>Command Center</h1><p>Live readiness across strategy, global education leaders, content, and summit operations.</p></div><small>WISE Innovation · Building the future of education</small></section><div className="exec-alert"><span/><b>Overall summit health: Strong</b><p>Three agent interventions are running across the critical path.</p><button onClick={() => setActive("Live Ops")}>Open live operations <ArrowRight size={14}/></button></div><section className="exec-kpis">{kpis.map(([label,value,note], index) => <article key={label}><span className={`metric-signal signal-${index}`}/><small>{label}</small><strong>{value}</strong><p>{note}</p></article>)}</section><section className="exec-grid"><article className="proto-panel timeline-panel"><PanelTitle eyebrow="Readiness against timeline" title="Summit critical path"/><div className="timeline-bars">{[["Strategy & theme",94],["Global speakers",72],["Content & sessions",68],["Production & venue",81],["Audience & partners",76]].map(([label,value]) => <div key={label as string}><span><b>{label}</b><em>{value}%</em></span><i><u style={{width:`${value}%`}}/></i></div>)}</div></article><article className="proto-panel stage-panel"><PanelTitle eyebrow="First three stages" title="Action center"/>{[["Strategy", "Theme approved", "94%"],["Speakers", "7 need action", "72%"],["Content", "6 slots open", "68%"]].map(([stage,note,value], index) => <button key={stage} onClick={() => setActive(stage as Stage)}><span>{index+1}</span><div><b>{stage}</b><small>{note}</small></div><strong>{value}</strong><ArrowRight size={16}/></button>)}</article></section></>;
}

function ProgramsView({ programs, onCreate }: { programs: ProgramRecord[]; onCreate: (program: ProgramRecord) => void }) {
  const [creating, setCreating] = useState(false);
  const [createdName, setCreatedName] = useState("");
  const [draft, setDraft] = useState<ProgramRecord>({ name: "WISE Summit 2028", theme: "AI for Sustainable Development", location: "Doha", attendees: "3,000", speakers: "150", budget: "$5M", narrative: "Instead of spending weeks preparing concept notes and planning documents, the system creates a structured operating environment immediately.", status: "Planning" });
  const update = (field: keyof ProgramRecord, value: string) => setDraft(current => ({ ...current, [field]: value }));
  const submit = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); onCreate(draft); setCreatedName(draft.name); setCreating(false); };

  if (creating) return <><div className="program-breadcrumb"><button onClick={()=>setCreating(false)}><ArrowLeft size={14}/>Programs</button><span>/</span><b>Create Program</b></div><section className="program-create"><header><span>Create a new summit · 2 mins</span><h1>Build the operating environment.</h1><p>Define the core brief once. The workspace, workstreams, and planning structure are created immediately.</p></header><form onSubmit={submit}><div className="program-fields"><label className="field-wide">Program name<input required value={draft.name} onChange={event=>update("name",event.target.value)}/></label><label className="field-wide">Theme<input required value={draft.theme} onChange={event=>update("theme",event.target.value)}/></label><label>Location<input required value={draft.location} onChange={event=>update("location",event.target.value)}/></label><label>Attendees<input required value={draft.attendees} onChange={event=>update("attendees",event.target.value)}/></label><label>Speakers<input required value={draft.speakers} onChange={event=>update("speakers",event.target.value)}/></label><label>Budget<input required value={draft.budget} onChange={event=>update("budget",event.target.value)}/></label><label className="field-wide">Narrative<textarea required rows={4} value={draft.narrative} onChange={event=>update("narrative",event.target.value)}/></label></div><aside className="program-preview"><span>Operating brief</span><h2>{draft.name}</h2><p>{draft.theme}</p><dl><div><dt>Location</dt><dd>{draft.location}</dd></div><div><dt>Audience</dt><dd>{draft.attendees}</dd></div><div><dt>Speakers</dt><dd>{draft.speakers}</dd></div><div><dt>Budget</dt><dd>{draft.budget}</dd></div></dl><blockquote>“{draft.narrative}”</blockquote><button type="submit"><Sparkles size={16}/>Create Program</button></aside></form></section></>;

  return <><div className="programs-heading"><div><span>Program portfolio</span><h1>Summits and operating environments</h1><p>Create and manage each summit from one shared command center.</p></div><button onClick={()=>setCreating(true)}><Plus size={16}/>Create Program</button></div>{createdName&&<div className="program-success"><Check size={16}/><p><b>{createdName} is ready.</b>Strategy, speakers, content, planning, budget, and risk workspaces were created.</p></div>}<section className="program-list">{programs.map(program=><article key={program.name}><header><span>{program.status}</span><CalendarDays size={18}/></header><h2>{program.name}</h2><p>{program.theme}</p><dl><div><dt>Location</dt><dd>{program.location}</dd></div><div><dt>Attendees</dt><dd>{program.attendees}</dd></div><div><dt>Speakers</dt><dd>{program.speakers}</dd></div><div><dt>Budget</dt><dd>{program.budget}</dd></div></dl><footer><small>{program.narrative}</small><button aria-label={`Open ${program.name}`}><ArrowRight size={16}/></button></footer></article>)}</section></>;
}

function StrategyView({ output, selectedTheme, setSelectedTheme, status, error, onRun, onApprove }: { output: StrategyOutput; selectedTheme: string; setSelectedTheme: (theme: string) => void; status: AgentStatus; error: string; onRun: () => void; onApprove: () => void }) {
  const selectedCandidate = output.candidates.find(candidate => candidate.theme === selectedTheme) ?? output.candidates[0];
  return <><PageHead eyebrow="Stage 01 · Strategy" title="Define the summit’s strategic spine." copy="Turn audience signals, WISE values, and market context into a defensible theme." action={status === "running" ? "Running Strategy Agent" : "Run Strategy Agent"} onAction={onRun} actionDisabled={status === "running"}/><div className="agent-map"><div className={`agent-node central ${status}`}><Bot size={21}/><b>Strategy Agent</b><small>{status === "running" ? "Synthesizing live signals" : status === "complete" ? "Synthesis complete" : "Ready to orchestrate"}</small></div>{[["Audience Research", "12 signals"],["WISE Archive", "5 summits"],["Market Lens", "8 trends"],["Impact Model", "6 outcomes"]].map(([name,note], index) => <div className={`agent-node node-${index}`} key={name}><Sparkles size={16}/><b>{name}</b><small>{note}</small></div>)}</div>{error&&<div className="strategy-error" role="alert"><AlertTriangle size={16}/><span>{error}</span><button onClick={onRun}>Retry</button></div>}<section className="strategy-grid"><article className="proto-panel"><PanelTitle eyebrow="Theme candidates" title="Select the narrative direction"/><div className="theme-list">{output.candidates.map((candidate,index) => <button className={selectedTheme === candidate.theme ? "selected" : ""} key={candidate.theme} onClick={() => setSelectedTheme(candidate.theme)}><span>{String(index+1).padStart(2,"0")}</span><div><b>{candidate.theme}</b><small>{candidate.territory}</small></div>{selectedTheme === candidate.theme && <Check size={17}/>}</button>)}</div></article><article className="proto-panel rationale"><PanelTitle eyebrow="Agent rationale" title={selectedCandidate?.theme ?? output.recommendedTheme}/><blockquote>“{output.rationale}”</blockquote><label>Strategic fit <b>{output.strategicFit}%</b></label><label>Audience resonance <b>{output.audienceResonance}%</b></label><label>Content extensibility <b>{output.contentExtensibility}%</b></label><button onClick={onApprove}><Check size={16}/> Approve strategic direction</button></article></section></>;
}

function SpeakersView({ speakers, filter, setFilter, status, error, onStageChange, onRun }: { speakers: SpeakerRecord[]; filter: string; setFilter: (value:string)=>void; status: AgentStatus; error: string; onStageChange:(name:string,stage:SpeakerStage)=>void; onRun:()=>void }) {
  const [selectedSpeaker, setSelectedSpeaker] = useState<SpeakerRecord | null>(null);
  const [draggedSpeaker, setDraggedSpeaker] = useState<string | null>(null);
  const [dropStage, setDropStage] = useState<SpeakerStage | null>(null);
  const finishDrag = () => { setDraggedSpeaker(null); setDropStage(null); };
  const dropSpeaker = (event: React.DragEvent<HTMLDivElement>, stage: SpeakerStage) => {
    event.preventDefault();
    const speakerName = draggedSpeaker ?? event.dataTransfer.getData("text/plain");
    if (speakerName) onStageChange(speakerName, stage);
    finishDrag();
  };
  return <><PageHead eyebrow="Stage 02 · Global speakers" title="Build the voices behind the theme." copy="Discover, score, engage, confirm, and prepare speakers with agent-supported handoffs." action={status === "running" ? "Searching the web" : "Run global discovery"} onAction={onRun} actionDisabled={status === "running"}/>{error&&<div className="strategy-error" role="alert"><AlertTriangle size={16}/><span>{error}</span><button onClick={onRun}>Retry</button></div>}<div className="speaker-toolbar"><div>{["All","USA","Europe","Africa","Asia"].map(region => <button className={filter===region?"active":""} key={region} onClick={()=>setFilter(region)}>{region}</button>)}</div><span><Globe2 size={15}/> 4 regions · {speakers.length} candidates</span></div><div className="response-guidance"><MessageSquareText size={16}/><p><b>Track invitation responses here.</b> Drag cards between stages or use the response status menu.</p></div><section className={`speaker-pipeline ${draggedSpeaker?"is-dragging":""}`}>{speakerStages.map(stage => { const matches=speakers.filter(speaker => speaker.stage===stage && (filter==="All"||speaker.region===filter)); return <div className={`pipeline-column ${dropStage===stage?"drop-target":""}`} key={stage} aria-label={`${stage} speaker stage`} onDragEnter={()=>setDropStage(stage)} onDragOver={event=>{event.preventDefault();event.dataTransfer.dropEffect="move";}} onDragLeave={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node))setDropStage(null);}} onDrop={event=>dropSpeaker(event,stage)}><header><b>{stage}</b><span>{matches.length}</span></header>{matches.map(speaker => <article key={speaker.name} draggable className={draggedSpeaker===speaker.name?"dragging":""} aria-label={`${speaker.name}, ${speaker.stage}. Drag to another stage.`} onDragStart={event=>{setDraggedSpeaker(speaker.name);event.dataTransfer.effectAllowed="move";event.dataTransfer.setData("text/plain",speaker.name);}} onDragEnd={finishDrag}><div><span>{speaker.name.split(" ").map(part=>part[0]).join("")}</span><em>{speaker.score}% fit</em></div><b>{speaker.name}</b><p>{speaker.role}</p><small>{speaker.region}</small><label className="response-select"><span>Response status</span><select aria-label={`Response status for ${speaker.name}`} value={speaker.stage} onChange={event=>onStageChange(speaker.name,event.target.value as SpeakerStage)}>{speakerStages.map(option=><option key={option}>{option}</option>)}</select></label><button className="speaker-open" onClick={()=>setSelectedSpeaker(speaker)}>Open profile <ArrowRight size={13}/></button><footer><i className={stage==="Ready"?"ready":""}/>{stage==="Identified"?"Agent ranked":"Human reviewed"}</footer></article>)}</div>;})}</section>{selectedSpeaker&&<div className="speaker-profile-backdrop" role="presentation" onClick={()=>setSelectedSpeaker(null)}><aside className="speaker-profile" role="dialog" aria-modal="true" aria-labelledby="speaker-profile-title" onClick={event=>event.stopPropagation()}><header><div><span>Speaker profile</span><h2 id="speaker-profile-title">{selectedSpeaker.name}</h2><p>{selectedSpeaker.role} · {selectedSpeaker.region}</p></div><button aria-label="Close speaker profile" onClick={()=>setSelectedSpeaker(null)}><X size={18}/></button></header><section className="speaker-bio"><span>{selectedSpeaker.name.split(" ").map(part=>part[0]).join("")}</span><div><small>Biography</small><p>A globally recognized education leader working across policy, evidence, and practical system transformation. Selected for strong alignment with the WISE Summit 2027 strategic narrative.</p>{selectedSpeaker.sourceUrl&&<a href={selectedSpeaker.sourceUrl} target="_blank" rel="noreferrer">View web source</a>}</div></section><dl><div><dt>Session assignment</dt><dd>{selectedSpeaker.stage==="Identified"||selectedSpeaker.stage==="Invited"?"Awaiting acceptance":"AI, Teachers and Human Agency"}</dd></div><div><dt>Travel status</dt><dd>{["Travel Planned","Ready"].includes(selectedSpeaker.stage)?"Itinerary confirmed · arrival 14 Apr":"Travel details pending"}</dd></div><div><dt>Editorial status</dt><dd>{selectedSpeaker.stage==="Ready"?"Biography and briefing approved":"Biography received · briefing in review"}</dd></div><div><dt>Response status</dt><dd>{selectedSpeaker.stage}</dd></div></dl><footer><span><Check size={14}/>{selectedSpeaker.score}% strategic fit</span><button onClick={()=>setSelectedSpeaker(null)}>Done</button></footer></aside></div>}</>;
}

function ContentView({ count, speakers, topics, setTopics, onRun }: { count:number; speakers:SpeakerRecord[]; topics:SessionTopic[]; setTopics:React.Dispatch<React.SetStateAction<SessionTopic[]>>; onRun:()=>void }) {
  const [selectedSession, setSelectedSession] = useState<ProgrammeSession | null>(null);
  const [topicTitle, setTopicTitle] = useState("");
  const [track, setTrack] = useState("Policy");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [selectedSpeaker, setSelectedSpeaker] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const generatedSession: ProgrammeSession = { title: "From Evidence to Adoption", track: "Policy", owner: "Content Curator", status: "Draft generated" };
  const eligibleSpeakers = speakers.filter(speaker => ["Accepted","Confirmed","Travel Planned","Ready"].includes(speaker.stage));
  const slotTimes = programmeRows.filter(row=>row.type==="slot").map(row=>row.time);
  const activeTopic = topics.find(topic=>topic.id===selectedTopicId);
  const addTopic = () => { if (!topicTitle.trim()) return; const topic={id:`topic-${Date.now()}`,title:topicTitle.trim(),track}; setTopics(current=>[...current,topic]); setSelectedTopicId(topic.id); setTopicTitle(""); };
  const assignSpeaker = () => { if (!selectedTopicId||!selectedSpeaker) return; setTopics(current=>current.map(topic=>topic.id===selectedTopicId?{...topic,speaker:selectedSpeaker}:topic)); };
  const placeSession = () => { if (!selectedTopicId||!selectedTime||!selectedLocation||!activeTopic?.speaker) return; setTopics(current=>current.map(topic=>topic.id===selectedTopicId?{...topic,time:selectedTime,location:selectedLocation}:topic)); };
  return <><PageHead eyebrow="Stage 03 · Content curation" title="Shape ideas into a coherent summit." copy="Translate strategy and speaker expertise into sessions, tracks, and measurable audience outcomes." action="Generate session" onAction={onRun}/><section className="content-stats"><article><small>Sessions defined</small><strong>{count+topics.length}/20</strong></article><article><small>Speakers assigned</small><strong>{topics.filter(topic=>topic.speaker).length+11}/18</strong></article><article><small>Learning outcomes</small><strong>86%</strong></article><article><small>Scheduled topics</small><strong>{topics.filter(topic=>topic.time).length}</strong></article></section><section className="session-workflow"><div className="workflow-heading"><span>Session workflow</span><h2>Topic to timetable</h2><p>Complete each step in order. Accepted speakers become available for assignment.</p></div><div className="workflow-steps"><fieldset><legend><span>1</span>Create topic</legend><label>Session topic<input value={topicTitle} onChange={event=>setTopicTitle(event.target.value)} placeholder="e.g. Learning beyond the classroom"/></label><label>Track<select value={track} onChange={event=>setTrack(event.target.value)}>{["Policy","Innovation","Global outlook","Roundtable","Workshop","Partner session"].map(option=><option key={option}>{option}</option>)}</select></label><button onClick={addTopic} disabled={!topicTitle.trim()}>Add topic</button></fieldset><fieldset><legend><span>2</span>Choose topic</legend><label>Draft topic<select value={selectedTopicId} onChange={event=>{setSelectedTopicId(event.target.value);setSelectedSpeaker("");}}><option value="">Select a topic</option>{topics.map(topic=><option value={topic.id} key={topic.id}>{topic.title}</option>)}</select></label><div className="step-status">{activeTopic?<><b>{activeTopic.track}</b><span>{activeTopic.speaker?`Assigned to ${activeTopic.speaker}`:"Awaiting speaker"}</span></>:<span>Create or select a topic to continue</span>}</div></fieldset><fieldset><legend><span>3</span>Assign speaker</legend><label>Accepted speaker<select value={selectedSpeaker} onChange={event=>setSelectedSpeaker(event.target.value)} disabled={!selectedTopicId}><option value="">Select a speaker</option>{eligibleSpeakers.map(speaker=><option value={speaker.name} key={speaker.name}>{speaker.name} · {speaker.stage}</option>)}</select></label><button onClick={assignSpeaker} disabled={!selectedTopicId||!selectedSpeaker}>Assign speaker</button><small>{eligibleSpeakers.length} speakers currently eligible</small></fieldset><fieldset><legend><span>4</span>Place in programme</legend><label>Time slot<select value={selectedTime} onChange={event=>setSelectedTime(event.target.value)} disabled={!activeTopic?.speaker}><option value="">Select time</option>{slotTimes.map(time=><option key={time}>{time}</option>)}</select></label><label>Room<select value={selectedLocation} onChange={event=>setSelectedLocation(event.target.value)} disabled={!activeTopic?.speaker}><option value="">Select room</option>{programmeLocations.map(location=><option key={location}>{location}</option>)}</select></label><button onClick={placeSession} disabled={!activeTopic?.speaker||!selectedTime||!selectedLocation}>Add to timetable</button></fieldset></div></section><section className="programme-section"><div className="programme-heading"><div><span>Summit programme</span><h2>Day 1 · Thursday, 15 April 2027</h2><p>All times shown in Arabia Standard Time · Doha</p></div><div className="programme-key"><span><i className="key-plenary"/>Plenary</span><span><i className="key-session"/>Session</span><span><i className="key-workshop"/>Workshop</span></div></div><div className="programme-scroll"><div className="programme-grid programme-locations"><div className="programme-time-head"><Clock3 size={14}/> Time</div>{programmeLocations.map(location=><div key={location}>{location}</div>)}</div>{programmeRows.map((row,rowIndex)=><div className={`programme-grid programme-row ${row.type}`} key={`${row.label}-${row.time}`}><div className="programme-time"><b>{row.label}</b><span>{row.time}</span></div>{row.type==="break"?<div className="programme-break"><span>{row.label}</span><i/></div>:row.type==="plenary"?<button className="programme-plenary" onClick={()=>setSelectedSession(row.sessions![0])}><span>{row.sessions![0].track}</span><b>{row.sessions![0].title}</b><small>{row.sessions![0].status}</small></button>:row.sessions!.map((session,index)=>{const assignedTopic=topics.find(topic=>topic.time===row.time&&topic.location===programmeLocations[index]);const visibleSession:ProgrammeSession=assignedTopic?{title:assignedTopic.title,track:assignedTopic.track,owner:assignedTopic.speaker!,status:"Scheduled"}:count>4&&rowIndex===9&&index===5?generatedSession:session;return <button className={`programme-session track-${visibleSession.track.toLowerCase().replaceAll(" ","-")}`} key={`${row.time}-${index}`} onClick={()=>setSelectedSession(visibleSession)} aria-expanded={selectedSession?.title===visibleSession.title}><span>{visibleSession.track}</span><b>{visibleSession.title}</b><small>{visibleSession.status}</small></button>})}</div>)}</div></section>{selectedSession&&<aside className="session-brief" aria-live="polite"><div><span>Session brief</span><h2>{selectedSession.title}</h2></div><button aria-label="Close session brief" onClick={()=>setSelectedSession(null)}><X size={18}/></button><dl><div><dt>Format</dt><dd>{selectedSession.track}</dd></div><div><dt>Owner / speaker</dt><dd>{selectedSession.owner}</dd></div><div><dt>Status</dt><dd>{selectedSession.status}</dd></div><div><dt>Outcome</dt><dd>Connect evidence and participant insight to a practical next action.</dd></div></dl><button className="brief-action">Open full brief <ArrowRight size={15}/></button></aside>}<section className="schedule-insights"><article className="proto-panel curator-panel"><PanelTitle eyebrow="Curation intelligence" title="Coverage against strategy"/><div className="coverage-grid">{[["Evidence to adoption",88],["Policy & coalitions",74],["Innovation at scale",92],["Equity & opportunity",81]].map(([label,value]) => <div className="coverage" key={label as string}><span><b>{label}</b><em>{value}%</em></span><i><u style={{width:`${value}%`}}/></i></div>)}</div><div className="agent-recommendation"><Sparkles size={18}/><p><b>Content gap detected</b>Add one session connecting evidence, policy, and practical adoption.</p><button onClick={onRun}>Apply recommendation</button></div></article></section></>;
}

function SessionIdeaLibrary({ ideas, status, error, onRetry, onAdd }: { ideas: SessionIdea[]; status: AgentStatus; error: string; onRetry: () => void; onAdd: (idea: SessionIdea) => void }) {
  const [filter, setFilter] = useState("All");
  const tracks = ["All", "Policy", "Innovation", "Global outlook", "Roundtable", "Workshop", "Partner session"];
  const visibleIdeas = ideas.filter(idea => filter === "All" || idea.track === filter);

  if (status === "running") return <section className="session-idea-state" aria-live="polite"><Sparkles size={20}/><div><b>Generating 100 session ideas</b><p>The Content Curator is building four distinct editorial batches.</p></div></section>;
  if (error) return <div className="strategy-error" role="alert"><AlertTriangle size={16}/><span>{error}</span><button onClick={onRetry}>Retry</button></div>;
  if (ideas.length === 0) return null;

  return <section className="session-idea-library"><header><div><span>Generated idea library</span><h2>{ideas.length} directions to explore</h2><p>Review the editorial options, then add promising ideas to the scheduling workflow.</p></div><div>{tracks.map(track => <button className={filter === track ? "active" : ""} key={track} onClick={() => setFilter(track)}>{track}</button>)}</div></header><div className="session-idea-grid">{visibleIdeas.map((idea, index) => <article key={idea.title}><span>{String(index + 1).padStart(2, "0")} · {idea.track}</span><h3>{idea.title}</h3><p>{idea.description}</p><button onClick={() => onAdd(idea)}><Plus size={14}/>Add to workflow</button></article>)}</div></section>;
}

function ModuleProfile({ active }: { active: Stage }) {
  const data: Record<string,[string,string,string][]> = { Stakeholders:[["Active relationships","148","12 need follow-up"],["Sponsors","8","2 pending assets"],["VIPs","24","91% confirmed"]], Planning:[["Milestones","36","29 on track"],["Open tasks","47","8 overdue"],["Critical path","3","1 due today"]], Budget:[["Approved","$270k","FY26 allocation"],["Committed","$184k","68% utilized"],["Variance","+$8.4k","Production watch"]], Risks:[["Open risks","6","2 high impact"],["Mitigated","18","This cycle"],["Agent flags","3","Need owner action"]], Approvals:[["Pending","7","3 due today"],["Approved","42","This cycle"],["Avg. cycle","1.8d","-0.4d trend"]], "Live Ops":[["Workstreams","9","7 green"],["Agent runs","12","5 active"],["Escalations","3","1 executive"]], Reports:[["Executive briefs","6","Latest today"],["Data sources","14","All synchronized"],["Exports","28","This month"]] };
  return <><PageHead eyebrow="Operational module" title={active} copy={`High-level ${active.toLowerCase()} profile with shared progress and agent observability.`}/><section className="module-cards">{(data[active]||[]).map(([label,value,note])=><article key={label}><small>{label}</small><strong>{value}</strong><p>{note}</p></article>)}</section><article className="proto-panel module-placeholder"><Network size={30}/><h2>{active} workspace</h2><p>This module is connected to the shared summit graph. Agent outputs, approvals, and exceptions from the first three stages appear here automatically.</p><button>Open module profile <ArrowRight size={15}/></button></article></>;
}

function AgentRail({ agents, logs }: { agents: typeof initialAgents; logs: string[] }) { const running=agents.filter(agent=>agent.status==="running").length; return <aside className="agent-rail"><header><span><Activity size={17}/></span><div><b>Agent observability</b><small>{agents.length} agents · {running} running</small></div><i/></header><section><label>Orchestration graph</label>{agents.map(agent=><div className={`agent-run ${agent.status}`} key={agent.name}><span className={agent.status}/><div><b>{agent.name}</b><small>{agent.task}</small></div><em>{agent.status}</em></div>)}</section><section className="run-log"><label>Live trace</label>{logs.map((log,index)=><div key={`${index}-${log}`}><time>{index===0?"now":`${index*4}m`}</time><p>{log}</p></div>)}</section><footer><Clock3 size={14}/> Last synchronized just now</footer></aside>; }
function PageHead({eyebrow,title,copy,action,onAction,actionDisabled=false}:{eyebrow:string;title:string;copy:string;action?:string;onAction?:()=>void|Promise<void>;actionDisabled?:boolean}) {
  const [actionPending, setActionPending] = useState(false);
  const handleAction = async () => {
    if (!onAction || actionPending) return;
    setActionPending(true);
    try {
      await onAction();
    } finally {
      setActionPending(false);
    }
  };
  const actionLabel = actionPending && action === "Generate session" ? "Generating session ideas" : action;
  return <div className="proto-heading"><div><span>{eyebrow}</span><h1>{title}</h1><p>{copy}</p></div>{action&&<button onClick={handleAction} disabled={actionDisabled||actionPending}><Play size={15}/>{actionLabel}</button>}</div>;
}
function PanelTitle({eyebrow,title}:{eyebrow:string;title:string}) { return <div className="proto-panel-title"><span>{eyebrow}</span><h2>{title}</h2></div>; }
