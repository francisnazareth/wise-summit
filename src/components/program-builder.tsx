"use client";

import { useState } from "react";
import { Check, GripVertical, MapPin, Users } from "lucide-react";

type BoardSession = {
  id: string;
  title: string;
  track: string;
  speaker: string;
  room: string;
  time: string;
};

const rooms = ["Auditorium", "Learning Lab", "Policy Studio", "Agora"];
const times = ["10:30–11:15", "11:30–12:15", "13:15–14:00"];
const tracks = ["All tracks", "Plenary", "Policy", "Innovation", "Workshop", "Roundtable"];
const initialSessions: BoardSession[] = [
  { id: "board-1", title: "From Evidence to System Change", track: "Policy", speaker: "Candidate 024", room: "Auditorium", time: times[0] },
  { id: "board-2", title: "AI, Teachers and Human Agency", track: "Innovation", speaker: "Candidate 031", room: "Learning Lab", time: times[0] },
  { id: "board-3", title: "Youth Voices on the Future", track: "Roundtable", speaker: "Candidate 016", room: "Agora", time: times[0] },
  { id: "board-4", title: "Financing Education Transformation", track: "Policy", speaker: "Candidate 024", room: "Policy Studio", time: times[1] },
  { id: "board-5", title: "Scaling What Works Lab", track: "Workshop", speaker: "Candidate 009", room: "Learning Lab", time: times[1] },
  { id: "board-6", title: "AI Literacy for Every Learner", track: "Innovation", speaker: "Candidate 031", room: "Auditorium", time: times[2] },
  { id: "board-7", title: "Student Agency in Practice", track: "Roundtable", speaker: "Candidate 016", room: "Agora", time: times[2] },
];

export function ProgramBuilder() {
  const [boardSessions, setBoardSessions] = useState(initialSessions);
  const [draggedId, setDraggedId] = useState("");
  const [trackFilter, setTrackFilter] = useState(tracks[0]);
  const [lastMove, setLastMove] = useState("Drag a session card to another room or time slot.");

  const moveSession = (sessionId: string, room: string, time: string) => {
    if (!sessionId) return;
    const moved = boardSessions.find(session=>session.id===sessionId);
    if (!moved) return;
    setBoardSessions(current=>current.map(session=>session.id===sessionId?{...session,room,time}:session));
    setLastMove(`${moved.title} moved to ${room} at ${time}.`);
    setDraggedId("");
  };

  return <section className="program-builder" aria-labelledby="program-builder-title"><header><div><span>Act 06 · Agenda builder</span><h2 id="program-builder-title">Program Builder</h2><p>The program becomes the operational backbone for communications, registration, logistics, and reporting.</p></div><div className="builder-totals"><span><b>{boardSessions.length}</b> sessions</span><span><b>{rooms.length}</b> rooms</span><span><b>{new Set(boardSessions.map(session=>session.speaker)).size}</b> speakers</span></div></header><div className="builder-toolbar"><div>{tracks.map(track=><button key={track} className={trackFilter===track?"active":""} onClick={()=>setTrackFilter(track)}>{track}</button>)}</div><p><Check size={13}/>{lastMove}</p></div><div className="builder-scroll"><div className="builder-board" style={{gridTemplateColumns:`112px repeat(${rooms.length}, minmax(175px, 1fr))`}}><div className="builder-corner">Time / room</div>{rooms.map(room=><div className="builder-room" key={room}><MapPin size={13}/>{room}</div>)}{times.map(time=><div className="builder-row" key={time} style={{display:"contents"}}><time>{time}</time>{rooms.map(room=>{const cellSessions=boardSessions.filter(session=>session.room===room&&session.time===time&&(trackFilter==="All tracks"||session.track===trackFilter));return <div className={draggedId?"builder-cell drop-ready":"builder-cell"} key={`${time}-${room}`} onDragOver={event=>event.preventDefault()} onDrop={event=>moveSession(event.dataTransfer.getData("text/plain"),room,time)}>{cellSessions.map(session=><article key={session.id} draggable onDragStart={event=>{event.dataTransfer.setData("text/plain",session.id);setDraggedId(session.id);}} onDragEnd={()=>setDraggedId("")} className={draggedId===session.id?"dragging":""}><GripVertical size={14}/><div><span>{session.track}</span><b>{session.title}</b><small><Users size={11}/>{session.speaker}</small></div></article>)}{cellSessions.length===0&&<span className="empty-slot">Drop session</span>}</div>})}</div>)}</div></div></section>;
}