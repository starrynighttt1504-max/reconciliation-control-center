import { FileSpreadsheet, Upload } from "lucide-react";
import { useRef, useState } from "react";

export default function FileUploader({ onUpload, sourceName }) {
  const ref=useRef(null);
  const [drag,setDrag]=useState(false);
  const handle=e=>{ const f=e.target.files?.[0]; if(f) onUpload(f); };
  return (
    <div
      onDragOver={e=>{e.preventDefault();setDrag(true)}}
      onDragLeave={()=>setDrag(false)}
      onDrop={e=>{e.preventDefault();setDrag(false);const f=e.dataTransfer.files?.[0];if(f)onUpload(f)}}
      className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${drag?"border-[#004679] bg-blue-50 dark:bg-blue-900/20":"border-slate-300 bg-white dark:border-white/10 dark:bg-[#212743]"}`}
    >
      <div className="rounded-2xl bg-slate-100 p-3 text-[#004679] dark:bg-white/10 dark:text-[#9FB0C8]"><FileSpreadsheet size={28}/></div>
      <h3 className="mt-3 font-black text-slate-900 dark:text-white">Import your Excel data</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">Drop a .xlsx file here. The app will read the Data sheet and refresh every chart.</p>
      <button onClick={()=>ref.current?.click()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#181C3B] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#004679] dark:bg-white dark:text-[#181C3B]">
        <Upload size={16}/> Choose Excel
      </button>
      <input ref={ref} type="file" accept=".xlsx,.xls" onChange={handle} className="hidden"/>
      <p className="mt-3 text-xs text-slate-400">Current source: {sourceName}</p>
    </div>
  );
}
