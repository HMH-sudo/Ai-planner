'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Download, Plus, ShieldCheck, Trash2 } from 'lucide-react';

const starterTasks = [
  { id: '1', title: 'Follow up PO #96007859 ETA', category: 'PO', priority: 'High', status: 'Waiting Vendor', owner: 'Vendor', dueDate: '2026-05-10', notes: 'Ask vendor for delivery status and ETA.', approvalRequired: true },
  { id: '2', title: 'Prepare GR list for invoice #3', category: 'GR', priority: 'Medium', status: 'Completed', owner: 'Hussain', dueDate: '2026-05-09', notes: 'GR numbers ready.', approvalRequired: false },
  { id: '3', title: 'Close HSE observations with evidence photos', category: 'HSE', priority: 'High', status: 'Need Decision', owner: 'Team', dueDate: '2026-05-09', notes: 'Need confirmation from all TLs.', approvalRequired: true }
];

const categories = ['PR','PO','WO','GR','PM','HSE','Vendor','Spare Parts','Email','Other'];
const priorities = ['Low','Medium','High','Critical'];
const statuses = ['Open','In Progress','Waiting Vendor','Waiting Approval','Need Decision','Completed','Delayed','Archived'];

function Stat({ title, value, icon }) {
  return <div className="card stat"><div className="icon">{icon}</div><div><div style={{color:'#94a3b8',fontSize:13}}>{title}</div><b>{value}</b></div></div>;
}

export default function Home() {
  const [ready, setReady] = useState(false);
  const [tasks, setTasks] = useState(starterTasks);
  const [tab, setTab] = useState('tasks');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [draft, setDraft] = useState({ title:'', category:'PM', priority:'Medium', status:'Open', owner:'Hussain', dueDate:new Date().toISOString().slice(0,10), notes:'', approvalRequired:true });

  useEffect(() => {
    const saved = localStorage.getItem('maintenance_ai_tasks_v2');
    if (saved) setTasks(JSON.parse(saved));
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem('maintenance_ai_tasks_v2', JSON.stringify(tasks)); }, [tasks, ready]);

  const today = new Date().toISOString().slice(0,10);
  const active = tasks.filter(t => t.status !== 'Archived');
  const filtered = active.filter(t => (`${t.title} ${t.category} ${t.owner} ${t.notes}`.toLowerCase().includes(query.toLowerCase())) && (statusFilter==='All'||t.status===statusFilter) && (priorityFilter==='All'||t.priority===priorityFilter));
  const stats = useMemo(() => ({
    total: active.length,
    completed: active.filter(t=>t.status==='Completed').length,
    delayed: active.filter(t=>t.status==='Delayed' || (t.dueDate < today && t.status !== 'Completed')).length,
    decision: active.filter(t=>t.status==='Need Decision' || t.approvalRequired).length,
    critical: active.filter(t=>t.priority==='Critical').length,
  }), [tasks]);

  const addTask = () => {
    if (!draft.title.trim()) return;
    setTasks([{...draft, id: crypto.randomUUID()}, ...tasks]);
    setDraft({...draft, title:'', notes:''});
  };
  const update = (id, field, value) => setTasks(tasks.map(t => t.id === id ? {...t, [field]: value} : t));
  const remove = (id) => setTasks(tasks.filter(t => t.id !== id));
  const exportCSV = () => {
    const headers = ['Title','Category','Priority','Status','Owner','Due Date','Approval Required','Notes'];
    const rows = tasks.map(t => [t.title,t.category,t.priority,t.status,t.owner,t.dueDate,t.approvalRequired?'Yes':'No',t.notes]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replaceAll('"','""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], {type:'text/csv'}));
    const a = document.createElement('a'); a.href=url; a.download=`maintenance_tasks_${today}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const completed = active.filter(t=>t.status==='Completed');
  const delayed = active.filter(t=>t.status==='Delayed'||(t.dueDate < today && t.status !== 'Completed'));
  const decisions = active.filter(t=>t.status==='Need Decision'||t.approvalRequired);

  return <main className="container">
    <div className="header">
      <div><h1 className="title">Maintenance AI Planner</h1><p className="sub">Dashboard مجاني كبداية، يعمل على Vercel ويخزن البيانات مؤقتًا في جهازك.</p></div>
      <button onClick={exportCSV}><Download size={16}/> Export CSV</button>
    </div>

    <div className="grid">
      <Stat title="Active Tasks" value={stats.total} icon={<Clock/>}/>
      <Stat title="Completed" value={stats.completed} icon={<CheckCircle2/>}/>
      <Stat title="Delayed" value={stats.delayed} icon={<AlertTriangle/>}/>
      <Stat title="Need Decision" value={stats.decision} icon={<ShieldCheck/>}/>
      <Stat title="Critical" value={stats.critical} icon={<AlertTriangle/>}/>
    </div>

    <div className="tabs">
      <button className={`tab ${tab==='tasks'?'active':''}`} onClick={()=>setTab('tasks')}>Tasks</button>
      <button className={`tab ${tab==='summary'?'active':''}`} onClick={()=>setTab('summary')}>Daily Summary</button>
      <button className={`tab ${tab==='agent'?'active':''}`} onClick={()=>setTab('agent')}>AI Rules</button>
    </div>

    {tab === 'tasks' && <>
      <div className="card form">
        <input placeholder="Task title" value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/>
        <select value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value})}>{categories.map(x=><option key={x}>{x}</option>)}</select>
        <select value={draft.priority} onChange={e=>setDraft({...draft,priority:e.target.value})}>{priorities.map(x=><option key={x}>{x}</option>)}</select>
        <select value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value})}>{statuses.filter(s=>s!=='Archived').map(x=><option key={x}>{x}</option>)}</select>
        <input type="date" value={draft.dueDate} onChange={e=>setDraft({...draft,dueDate:e.target.value})}/>
        <button onClick={addTask}><Plus size={16}/> Add</button>
        <textarea className="notes" placeholder="Notes / next action" value={draft.notes} onChange={e=>setDraft({...draft,notes:e.target.value})}/>
      </div>

      <div className="toolbar">
        <input placeholder="Search" value={query} onChange={e=>setQuery(e.target.value)}/>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option>All</option>{statuses.filter(s=>s!=='Archived').map(x=><option key={x}>{x}</option>)}</select>
        <select value={priorityFilter} onChange={e=>setPriorityFilter(e.target.value)}><option>All</option>{priorities.map(x=><option key={x}>{x}</option>)}</select>
        <button className="btn2" onClick={()=>{setQuery('');setStatusFilter('All');setPriorityFilter('All')}}>Reset</button>
      </div>

      <div className="tasks">{filtered.map(t => <div className="card task" key={t.id}>
        <div><input value={t.title} onChange={e=>update(t.id,'title',e.target.value)}/><div className="badges"><span className={`badge ${t.priority.toLowerCase()}`}>{t.priority}</span><span className={`badge ${t.status==='Completed'?'done':t.status==='Delayed'?'delay':t.status==='Need Decision'?'decision':''}`}>{t.status}</span>{t.approvalRequired && <span className="badge decision">Approval</span>}</div></div>
        <select value={t.category} onChange={e=>update(t.id,'category',e.target.value)}>{categories.map(x=><option key={x}>{x}</option>)}</select>
        <select value={t.priority} onChange={e=>update(t.id,'priority',e.target.value)}>{priorities.map(x=><option key={x}>{x}</option>)}</select>
        <select value={t.status} onChange={e=>update(t.id,'status',e.target.value)}>{statuses.map(x=><option key={x}>{x}</option>)}</select>
        <input type="date" value={t.dueDate} onChange={e=>update(t.id,'dueDate',e.target.value)}/>
        <div style={{display:'flex',gap:8}}><button className="btn2" onClick={()=>update(t.id,'status','Archived')}>Archive</button><button className="btnDanger" onClick={()=>remove(t.id)}><Trash2 size={16}/></button></div>
        <textarea className="notes" value={t.notes} onChange={e=>update(t.id,'notes',e.target.value)}/>
      </div>)}</div>
    </>}

    {tab === 'summary' && <div className="summary">
      <div className="card"><h3>Completed</h3><div className="list">{completed.map(t=><div key={t.id}>• {t.title}</div>)}</div></div>
      <div className="card"><h3>Delayed</h3><div className="list">{delayed.map(t=><div key={t.id}>• {t.title} — {t.dueDate}</div>)}</div></div>
      <div className="card"><h3>Need Decision</h3><div className="list">{decisions.map(t=><div key={t.id}>• {t.title}</div>)}</div></div>
    </div>}

    {tab === 'agent' && <div className="card"><h3>AI Agent Rules</h3><p className="list">راقب مهامي اليومية، جهز الردود والتقارير، لا ترسل أي إيميل ولا تعدل أي ملف إلا بعد موافقتي. في نهاية كل يوم أعطني ملخص: تم / متأخر / يحتاج قراري.</p><p className="sub">المرحلة القادمة: ربط قاعدة بيانات مجانية، ثم ربط Gmail بعد موافقتك.</p></div>}
    <div className="footer">MVP v1 — No email connection yet — Approval first workflow</div>
  </main>;
}
