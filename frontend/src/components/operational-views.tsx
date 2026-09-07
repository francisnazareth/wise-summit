"use client";

import { useState } from "react";
import {
  AlertTriangle, ArrowRight, CalendarCheck, Check, CircleDollarSign, Clock3,
  Download, FileBarChart, ListChecks, MapPin, Network, Radio, ShieldAlert, TrendingUp, Users,
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

const planningLanes = [
  { owner: "EMC", milestones: ["Theme endorsement · 28 Sep", "Programme gate · 14 Dec", "Final readiness · 22 Mar"], status: "Next gate in 21 days" },
  { owner: "Speakers", milestones: ["Priority list · 12 Oct", "Contracts 80% · 18 Jan", "Travel locked · 15 Mar"], status: "7 invitations need action" },
  { owner: "QNCC", milestones: ["Venue brief · 05 Oct", "Production freeze · 08 Feb", "Handover · 05 Apr"], status: "Technical brief in review" },
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
  return <><OperationalHead eyebrow="Section 02 · Integrated planning" title="Timeline" copy="Every deliverable, decision, and variation is mapped to the event lifecycle."/><section className="timeline-summary"><article><CalendarCheck size={18}/><div><small>Lifecycle readiness</small><strong>61%</strong></div></article><article><Clock3 size={18}/><div><small>Next phase gate</small><strong>18 days</strong></div></article><article><AlertTriangle size={18}/><div><small>Dependencies at risk</small><strong>3</strong></div></article></section><section className="lifecycle-timeline" aria-label="Seven phase event lifecycle">{phases.map((phase,index)=><article key={phase.name} className={phase.status === "Complete" ? "complete" : phase.status === "Active" ? "active" : ""}><div className="phase-marker"><span>{phase.status === "Complete" ? <Check size={15}/> : index+1}</span><i/></div><header><small>{phase.dates}</small><em>{phase.status}</em></header><h2>{phase.name}</h2><p>{phase.deliverables}</p><div className="phase-progress"><i><span style={{width:`${phase.progress}%`}}/></i><b>{phase.progress}%</b></div></article>)}</section><section className="planning-lanes proto-panel"><header><div><span>Critical workstreams</span><h2>EMC, speakers, and QNCC</h2></div><small>Linked to the integrated baseline</small></header>{planningLanes.map(lane=><article key={lane.owner}><b>{lane.owner}</b><div>{lane.milestones.map(milestone=><span key={milestone}><i/><small>{milestone}</small></span>)}</div><em>{lane.status}</em></article>)}</section></>;
}

export function StakeholdersView() {
  return <><OperationalHead eyebrow="Section 03 · Relationships" title="Stakeholders" copy="Coordinate decision makers, partners, working groups, and leadership touchpoints."/><section className="stakeholder-grid"><article className="proto-panel meeting-window"><header><span>Leadership coordination</span><h2>Meeting with Dr. Asyia and selected team members</h2></header><div><CalendarCheck size={22}/><p><b>Target week: 14 September 2026</b><small>Proposed: Tuesday 15 September · 10:00–10:45 AST</small></p></div><footer><span><i/>Availability check pending</span><button>Send availability poll <ArrowRight size={14}/></button></footer></article><article className="proto-panel stakeholder-groups"><header><span>Engagement governance</span><h2>Decision groups</h2></header>{[["Steering Committee","Theme, budget, major variations"],["Working Groups","Content and delivery recommendations"],["Executive leadership","Final institutional approvals"],["QNCC and suppliers","Venue and production commitments"]].map(([group,scope])=><div key={group}><Network size={15}/><p><b>{group}</b><small>{scope}</small></p><em>Owner assigned</em></div>)}</article></section></>;
}

export function BudgetView() {
  const approvals = [["Workstream submission","Workstream lead","Complete"],["Finance validation","Finance Lead","In review"],["Executive authorization","Executive Director","Pending"],["Committee ratification","Finance Committee","Pending"]];
  return <><OperationalHead eyebrow="Section 05 · Financial governance" title="Budget" copy="Manage the $10M summit baseline through clear authority, controls, and approvals."/><section className="budget-summary"><article><CircleDollarSign size={18}/><small>Approved baseline</small><strong>$10M</strong><span>100% governed</span></article><article><TrendingUp size={18}/><small>Committed</small><strong>$6.8M</strong><span>68% of baseline</span></article><article><ShieldAlert size={18}/><small>Controlled reserve</small><strong>$800k</strong><span>Executive release only</span></article></section><section className="budget-layout"><article className="proto-panel approval-ladder"><header><span>Approval process</span><h2>Spend authority ladder</h2></header>{approvals.map(([step,owner,status],index)=><div key={step}><b>{index+1}</b><p><strong>{step}</strong><small>{owner}</small></p><em className={status==="Complete"?"complete":""}>{status}</em></div>)}</article><article className="proto-panel budget-authority"><header><span>Decision rights</span><h2>Approval thresholds</h2></header>{[["Up to $25k","Workstream Lead + Finance"],["$25k–$250k","Executive Director"],["Above $250k","Finance Committee"],["Any reserve draw","Executive sponsor + Finance Committee"]].map(([threshold,route])=><div key={threshold}><b>{threshold}</b><span>{route}</span></div>)}</article></section></>;
}

export function VariationsView() {
  const [requests, setRequests] = useState([
    { id: "VAR-014", change: "Add second ministerial roundtable", impact: "+$120k · Programme gate +5 days", milestone: "Programme gate · 14 Dec", status: "Pending approval" },
    { id: "VAR-013", change: "Expand QNCC interpretation scope", impact: "+$85k · No date impact", milestone: "Production freeze · 08 Feb", status: "Finance review" },
    { id: "VAR-012", change: "Advance keynote travel booking", impact: "-$18k · Travel lock -7 days", milestone: "Travel locked · 15 Mar", status: "Approved" },
  ]);
  const approve = (id: string) => setRequests(current=>current.map(request=>request.id===id?{...request,status:"Approved"}:request));
  return <><OperationalHead eyebrow="Section 10 · Integrated change control" title="Variations" copy="Every requested change is assessed against the overall plan, budget, and accountable milestone."/><section className="variation-summary"><article><ListChecks size={18}/><small>Open requests</small><strong>{requests.filter(request=>request.status!=="Approved").length}</strong><span>All linked to milestones</span></article><article><CircleDollarSign size={18}/><small>Gross exposure</small><strong>$205k</strong><span>Before offsets</span></article><article><Clock3 size={18}/><small>Schedule exposure</small><strong>5 days</strong><span>Programme gate</span></article></section><section className="variation-register proto-panel"><header><span>Change register</span><h2>Planning-linked decisions</h2></header>{requests.map(request=><article key={request.id}><b>{request.id}</b><div><strong>{request.change}</strong><small>{request.impact}</small></div><span><CalendarCheck size={13}/>{request.milestone}</span>{request.status==="Approved"?<em><Check size={13}/>Approved</em>:<button onClick={()=>approve(request.id)}>{request.status}<ArrowRight size={13}/></button>}</article>)}</section></>;
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