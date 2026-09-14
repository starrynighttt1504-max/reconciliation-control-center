import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

const pad = (n) => String(n).padStart(2, "0");
const parseISO = (v) => {
  if (!v) return null;
  const [y,m,d] = String(v).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const monthNames = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const weekdays = ["Su","Mo","Tu","We","Th","Fr","Sa"];

export default function DatePicker({ value, onChange, placeholder = "dd/mm/yyyy", min, max }) {
  const [open, setOpen] = useState(false);
  const initial = parseISO(value) || new Date();
  const [view, setView] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const d = parseISO(value);
    if (d) setView(new Date(d.getFullYear(), d.getMonth(), 1));
  }, [value]);

  const cells = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    return Array.from({length: 42}, (_, i) => { const d = new Date(start); d.setDate(start.getDate()+i); return d; });
  }, [view]);

  const select = (d) => {
    const iso = toISO(d);
    if (min && iso < min) return;
    if (max && iso > max) return;
    onChange(iso);
    setOpen(false);
  };
  const display = value ? (() => { const d=parseISO(value); return d ? `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}` : value; })() : "";
  const today = toISO(new Date());

  return <div className="relative" ref={ref}>
    <button type="button" onClick={() => setOpen(v=>!v)} className="field flex w-full items-center justify-between gap-2 bg-white text-left dark:bg-[#212743]">
      <span className={display ? "text-[#181C3B] dark:text-white" : "text-slate-400"}>{display || placeholder}</span>
      <CalendarDays size={16} className="shrink-0 text-slate-500" />
    </button>
    {open && <div className="date-popover absolute left-0 top-[calc(100%+8px)] z-50 w-[300px] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-[#212743]">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={()=>setView(new Date(view.getFullYear(),view.getMonth()-1,1))} className="calendar-nav"><ChevronLeft size={17}/></button>
        <div className="text-sm font-black text-[#181C3B] dark:text-white">{monthNames[view.getMonth()]} {view.getFullYear()}</div>
        <button type="button" onClick={()=>setView(new Date(view.getFullYear(),view.getMonth()+1,1))} className="calendar-nav"><ChevronRight size={17}/></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400">{weekdays.map(w=><div key={w} className="py-1">{w}</div>)}</div>
      <div className="grid grid-cols-7 gap-1">{cells.map((d,i)=>{
        const iso=toISO(d), current=d.getMonth()===view.getMonth(), selected=iso===value, isToday=iso===today, disabled=(min&&iso<min)||(max&&iso>max);
        return <button type="button" key={`${iso}-${i}`} disabled={disabled} onClick={()=>select(d)} className={`calendar-day ${current?"":"outside"} ${selected?"selected":""} ${isToday&&!selected?"today":""} ${disabled?"disabled":""}`}>{d.getDate()}</button>;
      })}</div>
      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-xs font-bold dark:border-white/10">
        <button type="button" onClick={()=>{onChange("");setOpen(false)}} className="text-slate-500 hover:text-[#181C3B] dark:hover:text-white">Clear</button>
        <button type="button" onClick={()=>select(new Date())} className="rounded-lg px-2.5 py-1.5 text-[#1473E6] hover:bg-blue-50 dark:hover:bg-white/5">Today</button>
      </div>
    </div>}
  </div>;
}
