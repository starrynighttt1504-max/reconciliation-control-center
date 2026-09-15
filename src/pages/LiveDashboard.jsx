import { useMemo, useState } from "react";
import { Activity, ArrowDownToLine, ArrowUpFromLine, BarChart3, CalendarDays, ChevronDown, CircleAlert, GitBranch, Users, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList, Pie, PieChart, Cell } from "recharts";

const integer = v => Math.round(Number(v)||0).toLocaleString("id-ID");
const money = v => `Rp ${Math.round(Number(v)||0).toLocaleString("id-ID")}`;
const sum=(rows,key)=>rows.reduce((a,r)=>a+(Number(r[key])||0),0);
const text=v=>String(v??"").trim();
const monthLong=(y,m)=>new Date(Number(y),Number(m)-1,1).toLocaleString("id-ID",{month:"long"});
const pct=(v)=>`${Math.abs(Number(v)||0).toFixed(1)}%`;
const changePct=(cur,prev)=>prev===0?(cur===0?0:100):((cur-prev)/Math.abs(prev))*100;

function aggregate(rows){return {depo:sum(rows,"Total DP"),wd:sum(rows,"Total WD"),regis:sum(rows,"RGS"),rd:sum(rows,"RD"),deposit:sum(rows,"Total DP"),transactions:sum(rows,"Total Transaksi")};}
const metrics={depo:{label:"Total DEPO",key:"Total DP",format:"money"},wd:{label:"Total WD",key:"Total WD",format:"money"},regis:{label:"Total Regis",key:"RGS",format:"integer"},rd:{label:"Total Regis Depo",key:"RD",format:"integer"}};
function Kpi({icon:Icon,label,value,note}){return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-[#212743]"><div className="flex items-start justify-between"><div><p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p><p className="mt-2 text-2xl font-black dark:text-white">{value}</p></div><div className="rounded-xl bg-slate-100 p-2.5 text-[#004679] dark:bg-white/10 dark:text-[#9FB0C8]"><Icon size={20}/></div></div>{note&&<p className="mt-3 text-xs font-semibold text-slate-400">{note}</p>}</div>}
function TrendLabel({x,y,value}){if(value==null)return null;return <text x={x} y={y-10} textAnchor="middle" fontSize="10" fontWeight="800" fill="currentColor">{value>0?`+${pct(value)}`:value<0?`-${pct(value)}`:"0%"}</text>}
function Analysis({title,current,previous,label}){const delta=changePct(current,previous);const up=delta>0,down=delta<0;const Icon=up?TrendingUp:down?TrendingDown:Minus;const cls=up?"text-emerald-600":down?"text-rose-600":"text-slate-500";const desc=up?`${label} naik ${pct(delta)} dibanding titik sebelumnya.`:down?`${label} turun ${pct(delta)} dibanding titik sebelumnya.`:`${label} relatif stabil dibanding titik sebelumnya.`;return <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5"><div className="flex items-center justify-between"><p className="text-xs font-black uppercase tracking-wide text-slate-400">{title}</p><Icon size={18} className={cls}/></div><p className={`mt-2 text-xl font-black ${cls}`}>{delta>0?"+":""}{delta.toFixed(1)}%</p><p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-300">{desc}</p></div>}

export default function LiveDashboard({rows=[],year,month,brand,runningDate,runningStatus}){
 const [rankingMetric,setRankingMetric]=useState("depo"); const numericYear=Number(year); const runningMonth=runningDate?Number(runningDate.slice(5,7)):0; const selectedMonth=month==="ALL"?runningMonth:Number(month);
 const source=useMemo(()=>rows.filter(r=>Number(r.Year)===numericYear&&(!selectedMonth||Number(r["Num Month"])===selectedMonth)&&(!runningDate||r.Date<=runningDate)),[rows,numericYear,selectedMonth,runningDate]);
 const filteredSource=useMemo(()=>source.filter(r=>brand==="ALL"||r.Brand===brand),[source,brand]);
 const trendRows=useMemo(()=>{const m=new Map();filteredSource.forEach(r=>{if(!m.has(r.Date))m.set(r.Date,[]);m.get(r.Date).push(r)});const arr=[...m.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([date,data],i)=>{const a=aggregate(data);const brands=[...new Map(data.map(r=>[r.Brand,(Number(r["Total DP"])||0)+(Number(r["Total WD"])||0)]))].sort((a,b)=>b[1]-a[1]);return {date:date.slice(8),fullDate:date,depo:a.depo,wd:a.wd,topBrand:brands[0]?.[0]||"-",topBrandValue:brands[0]?.[1]||0,depoChange:i?changePct(a.depo,0):0,wdChange:i?changePct(a.wd,0):0};});for(let i=0;i<arr.length;i++){arr[i].depoChange=i?changePct(arr[i].depo,arr[i-1].depo):0;arr[i].wdChange=i?changePct(arr[i].wd,arr[i-1].wd):0;}return arr;},[filteredSource]);
 const topBrand=useMemo(()=>{const m=new Map();source.forEach(r=>m.set(r.Brand,(m.get(r.Brand)||0)+(Number(r["Total DP"])||0)+(Number(r["Total WD"])||0)));return [...m.entries()].sort((a,b)=>b[1]-a[1])[0]||["-",0]},[source]);
 const rankingRows=useMemo(()=>{const by=new Map();source.forEach(r=>{if(!by.has(r.Brand))by.set(r.Brand,[]);by.get(r.Brand).push(r)});return [...by.entries()].map(([b,rs])=>({brand:b,value:sum(rs,metrics[rankingMetric].key)})).filter(r=>brand==="ALL"||r.brand===brand).sort((a,b)=>b.value-a.value)},[source,rankingMetric,brand]);
 const rankingTrend=useMemo(()=>{const days=[...new Set(source.map(r=>r.Date))].sort();const selectedBrands=brand!=="ALL"?[brand]:rankingRows.slice(0,5).map(r=>r.brand);return days.map(d=>{const row={date:d.slice(8),fullDate:d};selectedBrands.forEach(b=>{row[b]=sum(source.filter(r=>r.Date===d&&r.Brand===b),metrics[rankingMetric].key)});return row})},[source,brand,rankingRows,rankingMetric]);
 const rankingAnalysis=useMemo(()=>{const vals=rankingTrend.map(d=>brand!=="ALL"?d[brand]:d[rankingRows[0]?.brand||""]).filter(v=>v!=null);const first=vals[0]||0,last=vals[vals.length-1]||0;const delta=changePct(last,first);const max=Math.max(...vals,0),min=Math.min(...vals,0);return {first,last,delta,max,min,direction:delta>0?"naik":delta<0?"turun":"stabil"}},[rankingTrend,brand,rankingRows]);
 const selectedMetric=metrics[rankingMetric]; const selectedLabel=selectedMetric.label; const formatMetric=v=>selectedMetric.format==="money"?money(v):integer(v);
 const palette=["#1473E6","#10B981","#F59E0B","#8B5CF6","#EF4444"];
 return <div className="w-full min-w-0 space-y-5 overflow-x-hidden">
  <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-[#212743]"><div className="flex min-w-0 flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><CalendarDays size={20}/><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#7088A9]">Daily Running</p><h2 className="mt-1 text-xl font-black dark:text-white">{runningDate||"No available date"}</h2></div></div><span className="rounded-full px-3 py-1.5 text-xs font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{runningStatus}</span></div><p className="mt-2 text-sm text-slate-500">Data hari ini dipakai jika tersedia. Jika belum diinput, otomatis H-1. Data future/placeholder diabaikan.</p></section>
  <div className="grid w-full min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4"><Kpi icon={BarChart3} label="Total Transaksi" value={integer(sum(filteredSource.filter(r=>r.Date===runningDate),"Total Transaksi"))} note="Trans DP + Trans WD"/><Kpi icon={ArrowDownToLine} label="Total Deposit" value={money(sum(filteredSource.filter(r=>r.Date===runningDate),"Total DP"))} note={`${integer(sum(filteredSource.filter(r=>r.Date===runningDate),"Trans DP"))} transaksi DEPO`}/><Kpi icon={Users} label="Registrasi" value={integer(sum(filteredSource.filter(r=>r.Date===runningDate),"RGS"))}/><Kpi icon={Activity} label="Total Regis Depo" value={integer(sum(filteredSource.filter(r=>r.Date===runningDate),"RD"))}/></div>
  <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-[#212743]"><div className="flex min-w-0 flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#7088A9]">Running Trend</p><h2 className="mt-1 text-xl font-black dark:text-white">Total DEPO vs Total WD</h2></div><span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 dark:bg-white/5 dark:text-slate-300">Brand tertinggi: <b>{topBrand[0]}</b> ({money(topBrand[1])})</span></div><div className="mt-2 flex flex-wrap gap-4 text-xs font-bold"><span className="text-emerald-600">● DEPO</span><span className="text-rose-600">● WD</span></div><p className="mb-3 text-sm text-slate-500">Chart menggunakan nominal Total DEPO dan Total WD, bukan jumlah transaksi. Jumlah transaksi tetap tersedia di KPI dan tabel Daily Check.</p><div className="h-[350px]"><ResponsiveContainer><LineChart data={trendRows} margin={{top:20,right:20,left:0,bottom:5}}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip content={({active,payload,label})=>active&&payload?.length?<div className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-xl dark:border-white/10 dark:bg-[#212743]"><p className="font-black">Tanggal {label}</p>{payload.map(p=><p key={p.dataKey} className="mt-1"><b>{p.name}:</b> {money(p.value)} ({p.dataKey==="depo"?(p.payload.depoChange>=0?"+":"")+pct(p.payload.depoChange): (p.payload.wdChange>=0?"+":"")+pct(p.payload.wdChange)})</p>)}<p className="mt-1 text-slate-500">Brand tertinggi: <b>{payload[0]?.payload?.topBrand}</b> ({money(payload[0]?.payload?.topBrandValue)})</p><p className="mt-1 font-bold">{(payload[0]?.payload?.depoChange||0)>0?"DEPO naik dibanding hari sebelumnya.":(payload[0]?.payload?.depoChange||0)<0?"DEPO turun dibanding hari sebelumnya.":"DEPO stabil."}</p></div>:null}/><Line type="monotone" dataKey="depo" name="DEPO" stroke="#10B981" strokeWidth={3} dot={{r:4,fill:"#10B981"}} activeDot={{r:6}}><LabelList dataKey="depoChange" content={<TrendLabel/>}/></Line><Line type="monotone" dataKey="wd" name="WD" stroke="#EF4444" strokeWidth={3} dot={{r:4,fill:"#EF4444"}} activeDot={{r:6}}><LabelList dataKey="wdChange" content={<TrendLabel/>}/></Line></LineChart></ResponsiveContainer></div><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{trendRows.slice(-4).map(r=><div key={r.fullDate} className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-white/5"><p className="text-[11px] font-bold text-slate-400">{r.fullDate}</p><p className="text-sm font-black dark:text-white">{r.topBrand}</p><p className="text-xs text-slate-500">DEPO {money(r.depo)} · WD {money(r.wd)}</p></div>)}</div></section>
  <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-[#212743]">
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-xs font-black uppercase tracking-[.18em] text-[#7088A9]">Monthly Brand Ranking</p>
        <h2 className="mt-1 text-xl font-black dark:text-white">Ranking Brand — {monthLong(numericYear, selectedMonth)} {numericYear}</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Ranking berdasarkan total nominal DEPO. Periode ditampilkan per bulan agar lebih mudah melihat brand dengan performa tertinggi.</p>
      </div>
      <label className="relative">
        <select value={rankingMetric} onChange={e=>setRankingMetric(e.target.value)} className="field h-11 min-w-[210px] rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-black dark:border-white/10 dark:bg-[#212743] dark:text-white">
          <option value="depo">Ranking Total DEPO</option>
          <option value="wd">Ranking Total WD</option>
          <option value="regis">Ranking Total Regis</option>
          <option value="rd">Ranking Total Regis Depo</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-3 text-slate-400" size={15}/>
      </label>
    </div>

    <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_310px]">
      <div className="min-w-0 overflow-hidden rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-black dark:text-white">Ranking {selectedLabel}</p>
            <p className="text-xs font-semibold text-slate-400">Tertinggi → terendah</p>
          </div>
          <span className="rounded-full bg-[#1473E6]/10 px-3 py-1.5 text-xs font-black text-[#1473E6] dark:bg-[#1473E6]/15">{rankingRows.length} brand</span>
        </div>
        <div className="h-[380px]">
          <ResponsiveContainer>
            <BarChart data={rankingRows} margin={{top:25,right:20,left:10,bottom:35}}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="brand" tick={{fontSize:11,fontWeight:800}} interval={0} angle={0}/>
              <YAxis tick={{fontSize:11}}/>
              <Tooltip formatter={(value)=>formatMetric(value)} labelFormatter={(label)=>`Brand: ${label}`}/>
              <Bar dataKey="value" name={selectedLabel} radius={[8,8,0,0]} fill="#1473E6">
                <LabelList dataKey="value" position="top" formatter={(value)=>selectedMetric.format==="money"?`${(Number(value)/1e9).toFixed(2)}B`:integer(value)} fontSize={10} fontWeight={800}/>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">#1 Brand Bulan Ini</p>
          <p className="mt-2 text-2xl font-black dark:text-white">{rankingRows[0]?.brand || "-"}</p>
          <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-300">{rankingRows[0] ? formatMetric(rankingRows[0].value) : "-"}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">Top Ranking</p>
          <div className="mt-3 space-y-2">
            {rankingRows.slice(0,6).map((r,i)=><div key={r.brand} className="flex items-center justify-between rounded-xl bg-white px-3 py-2.5 dark:bg-[#212743]"><span className="flex min-w-0 items-center gap-2"><span className="w-6 text-xs font-black text-slate-400">#{i+1}</span><span className="truncate text-sm font-black dark:text-white">{r.brand}</span></span><span className="ml-3 shrink-0 text-xs font-black dark:text-slate-200">{formatMetric(r.value)}</span></div>)}
            {!rankingRows.length && <p className="py-4 text-center text-xs font-semibold text-slate-500">Tidak ada data ranking untuk filter yang dipilih.</p>}
          </div>
        </div>
      </div>
    </div>

    <div className="table-shell mt-4 w-full min-w-0 overflow-hidden">
      <div className="max-w-full overflow-x-auto">
        <table className="w-full min-w-[650px] text-sm">
          <thead><tr className="border-b text-left text-xs uppercase tracking-wider text-slate-400 dark:border-white/10"><th className="px-3 py-3">Rank</th><th className="px-3 py-3">Brand</th><th className="px-3 py-3 text-right">{selectedLabel}</th><th className="px-3 py-3 text-right">% dari Top</th></tr></thead>
          <tbody>{rankingRows.map((r,i)=><tr key={r.brand} className="border-b border-slate-100 dark:border-white/5"><td className="px-3 py-3 font-black">#{i+1}</td><td className="px-3 py-3 font-black dark:text-white">{r.brand}</td><td className="px-3 py-3 text-right font-black">{formatMetric(r.value)}</td><td className="px-3 py-3 text-right font-bold text-slate-500 dark:text-slate-300">{rankingRows[0]?.value ? ((r.value/rankingRows[0].value)*100).toFixed(1) : "0.0"}%</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  </section>
  </div>
}
