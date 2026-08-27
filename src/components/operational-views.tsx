"use client";

import { useState } from "react";
import {
  AlertTriangle, ArrowRight, CalendarCheck, Check, CircleDollarSign, Clock3,
  Download, FileBarChart, MapPin, Radio, ShieldAlert, TrendingUp, Users,
} from "lucide-react";

const phases = [
  { name: "Initial Planning", dates: "May–Jun 2026", progress: 100, deliverables: "Charter · budget · governance", status: "Complete" },
  { name: "Content & Stakeholders", dates: "Jul–Oct 2026", progress: 78, deliverables: "Theme · speakers · partners", status: "Active" },
  { name: "Launch & Promotion", dates: "Nov–Dec 2026", progress: 62, deliverables: "Campaign · registration · press", status: "Active" },
  { name: "Logistics", dates: "Jan–Feb 2027", progress: 46, deliverables: "Venue · travel · suppliers", status: "In progress" },
  { name: "Operations", dates: "Mar 2027", progress: 28, deliverables: "Runbooks · staffing · rehearsals", status: "Upcoming" },
  { name: "Execution", dates: "15 Apr 2027", progress: 8, deliverables: "Live summit · issue response", status: "Upcoming" },
  { name: "Post Event", dates: "Apr–May 2027", progress: 0, deliverables: "Insights · reporting · follow-up", status: "Upcoming" },
];

const initialRisks = [
  { name: "Key Speaker Cancellation", owner: "Speaker Lead", likelihood: 4, impact: 5, response: "Backup keynote held", status: "Monitoring" },
  { name: "Venue Risk", owner: "Operations Lead", likelihood: 2, impact: 5, response: "Secondary hall reserved", status: "Mitigated" },
  { name: "Sponsor Withdrawal", owner: "Partnerships", likelihood: 3, impact: 4, response: "Replacement pipeline open", status: "Action needed" },
  { name: "Budget Overrun", owner: "Finance Lead", likelihood: 3, impact: 3, response: "Production scope gate", status: "Monitoring" },
];

const initialAlerts = [
  { id: 1, time: "09:42", title: "Flight QR728 delayed 55 minutes", detail: "Two confirmed speakers affected", level: "high", status: "Open" },
  { id: 2, time: "09:37", title: "Agora capacity at 91%", detail: "Overflow room routing recommended", level: "medium", status: "Open" },
  { id: 3, time: "09:31", title: "Partner Hub AV check complete", detail: "All systems ready", level: "low", status: "Resolved" },
];

function OperationalHead({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return <div className="proto-heading ops-heading"><div><span>{eyebrow}</span><h1>{title}</h1><p>{copy}</p></div></div>;
}

export function TimelineView() {
  return <><OperationalHead eyebrow="Act 04 · Phase-based planning" title="Timeline" copy="Every deliverable is automatically mapped to the event lifecycle."/><section className="timeline-summary"><article><CalendarCheck size={18}/><div><small>Lifecycle readiness</small><strong>61%</strong></div></article><article><Clock3 size={18}/><div><small>Next phase gate</small><strong>18 days</strong></div></article><article><AlertTriangle size={18}/><div><small>Dependencies at risk</small><strong>3</strong></div></article></section><section className="lifecycle-timeline" aria-label="Seven phase event lifecycle">{phases.map((phase,index)=><article key={phase.name} className={phase.status === "Complete" ? "complete" : phase.status === "Active" ? "active" : ""}><div className="phase-marker"><span>{phase.status === "Complete" ? <Check size={15}/> : index+1}</span><i/></div><header><small>{phase.dates}</small><em>{phase.status}</em></header><h2>{phase.name}</h2><p>{phase.deliverables}</p><div className="phase-progress"><i><span style={{width:`${phase.progress}%`}}/></i><b>{phase.progress}%</b></div></article>)}</section></>;
}

export function RiskView() {
  const [risks, setRisks] = useState(initialRisks);
  const advanceRisk = (name: string) => setRisks(current=>current.map(risk=>risk.name===name?{...risk,status:risk.status==="Mitigated"?"Monitoring":"Mitigated"}:risk));
  return <><OperationalHead eyebrow="Act 07 · Leadership visibility" title="Risk Command Center" copy="Leadership can see operational risk months before event execution."/><section className="risk-kpis"><article><ShieldAlert size={18}/><small>Open risks</small><strong>6</strong><span>2 high impact</span></article><article><TrendingUp size={18}/><small>Risk exposure</small><strong>-18%</strong><span>Since last review</span></article><article><Check size={18}/><small>Mitigations active</small><strong>14</strong><span>3 agent monitored</span></article></section><section className="risk-layout"><article className="risk-heatmap proto-panel"><header><div><span>Likelihood × impact</span><h2>Portfolio heatmap</h2></div><small>4 active examples</small></header><div className="heatmap-shell"><b className="heatmap-y">Impact</b><div className="heatmap-grid">{[5,4,3,2,1].flatMap(impact=>[1,2,3,4,5].map(likelihood=>{const matches=risks.filter(risk=>risk.impact===impact&&risk.likelihood===likelihood);return <div key={`${impact}-${likelihood}`} className={`heat-cell heat-${impact*likelihood}`} aria-label={`Impact ${impact}, likelihood ${likelihood}`}>{matches.map(risk=><span key={risk.name} title={risk.name}>{risk.name.split(" ").map(word=>word[0]).join("").slice(0,3)}</span>)}</div>}))}</div><b className="heatmap-x">Likelihood</b></div></article><article className="risk-register proto-panel"><header><span>Active register</span><h2>Priority risks</h2></header>{risks.map(risk=><div className="risk-row" key={risk.name}><span className={`risk-score risk-score-${risk.impact*risk.likelihood}`}>{risk.impact*risk.likelihood}</span><div><b>{risk.name}</b><small>{risk.owner} · {risk.response}</small></div><button onClick={()=>advanceRisk(risk.name)}>{risk.status}<ArrowRight size={13}/></button></div>)}</article></section></>;
}

export function LiveOperationsView() {
  const [alerts, setAlerts] = useState(initialAlerts);
  const resolveAlert = (id: number) => setAlerts(current=>current.map(alert=>alert.id===id?{...alert,status:"Resolved"}:alert));
  return <><OperationalHead eyebrow="Act 08 · Summit week" title="Operations Command Center" copy="During summit week, this becomes mission control."/><section className="live-strip"><span><Radio size={15}/>Live · Doha</span><time>09:46 AST</time><b>All core systems operational</b></section><section className="operations-kpis"><article><Users size={18}/><small>Registrations</small><strong>2,847</strong><span>94.9% of target</span></article><article><MapPin size={18}/><small>Speaker arrivals</small><strong>128/150</strong><span>12 in transit</span></article><article><AlertTriangle size={18}/><small>Open issues</small><strong>{alerts.filter(alert=>alert.status==="Open").length}</strong><span>1 high priority</span></article><article><ShieldAlert size={18}/><small>Escalations</small><strong>3</strong><span>1 executive</span></article></section><section className="operations-grid"><article className="live-alerts proto-panel"><header><div><span>Live alerts</span><h2>Operations feed</h2></div><em>{alerts.filter(alert=>alert.status==="Open").length} open</em></header>{alerts.map(alert=><div className={`live-alert ${alert.level}`} key={alert.id}><time>{alert.time}</time><span/><div><b>{alert.title}</b><small>{alert.detail}</small></div>{alert.status==="Open"?<button onClick={()=>resolveAlert(alert.id)}>Resolve</button>:<em><Check size={13}/>Resolved</em>}</div>)}</article><article className="venue-status proto-panel"><header><span>Rooms & arrivals</span><h2>Current status</h2></header>{[["Auditorium","Opening plenary","Live · 82% capacity"],["Learning Lab","Scaling What Works","Boarding · 64% capacity"],["Policy Studio","System Change","Ready · doors open"],["Speaker desk","Arrivals","128 checked in"]].map(([place,event,status])=><div key={place}><i/><span><b>{place}</b><small>{event}</small></span><em>{status}</em></div>)}</article></section></>;
}

export function ReportsView() {
  const [generated, setGenerated] = useState("Today · 09:30 AST");
  const generate = () => setGenerated("Just now · synchronized from 14 sources");
  return <><OperationalHead eyebrow="Act 09 · Executive reporting" title="Executive Reports" copy="Once the summit is over, reporting becomes automatic instead of a six-week manual exercise."/><section className="report-hero"><div><span>Summit impact brief</span><h2>WISE Summit 2027 Executive Report</h2><p>Strategy, programme, audience, operations, finance, and impact data are synchronized into one governed report.</p><small>Last generated {generated}</small></div><button onClick={generate}><FileBarChart size={16}/>Generate latest report</button></section><section className="report-metrics"><article><Users size={18}/><small>Total attendance</small><strong>2,847</strong><span>95% of target</span></article><article><CalendarCheck size={18}/><small>Sessions delivered</small><strong>48</strong><span>96% on schedule</span></article><article><TrendingUp size={18}/><small>Audience satisfaction</small><strong>92%</strong><span>+7 pts vs 2025</span></article><article><CircleDollarSign size={18}/><small>Budget variance</small><strong>-1.8%</strong><span>Within tolerance</span></article></section><section className="report-grid"><article className="proto-panel report-sections"><header><span>Automated sections</span><h2>Report readiness</h2></header>{[["Executive summary",100],["Programme performance",96],["Audience & registration",100],["Speaker outcomes",92],["Partner value",88],["Financial close",74]].map(([name,value])=><div key={name as string}><span><b>{name}</b><em>{value}%</em></span><i><u style={{width:`${value}%`}}/></i></div>)}</article><article className="proto-panel report-exports"><header><span>Ready to share</span><h2>Executive outputs</h2></header>{["Board briefing · PDF","Impact dataset · XLSX","Partner report · PDF"].map(item=><button key={item}><Download size={15}/><span>{item}</span><ArrowRight size={14}/></button>)}</article></section></>;
}