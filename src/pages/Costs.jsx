import BreakdownDonut from "../components/BreakdownDonut";
import { costKeys } from "../utils/calculations";
export default function Costs({selected}) {
  const data=costKeys.map(k=>({name:k,value:Number(selected?.[k])||0})).filter(x=>x.value>0);
  const total=data.reduce((a,x)=>a+x.value,0);
  const max=data.slice().sort((a,b)=>b.value-a.value)[0];
  return <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-[#212743]"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#7088A9]">Costs</p><h2 className="mt-1 text-2xl font-black dark:text-white">Expense breakdown</h2><BreakdownDonut data={data}/></section>
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-[#212743]"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
      <div className="rounded-2xl bg-slate-50 p-5 dark:bg-white/5"><p className="text-xs uppercase tracking-wider text-slate-500">Total costs</p><p className="mt-1 text-3xl font-black dark:text-white">${total.toLocaleString()}</p></div>
      <div className="rounded-2xl bg-slate-50 p-5 dark:bg-white/5"><p className="text-xs uppercase tracking-wider text-slate-500">Highest category</p><p className="mt-1 text-xl font-black dark:text-white">{max?.name||"—"}</p><p className="text-sm text-slate-500">${(max?.value||0).toLocaleString()}</p></div>
      {data.map(x=><div key={x.name} className="rounded-xl border border-slate-200 p-4 dark:border-white/10"><div className="flex justify-between"><span className="font-bold dark:text-white">{x.name}</span><span className="font-black dark:text-white">${x.value.toLocaleString()}</span></div><div className="mt-2 h-2 rounded-full bg-slate-100 dark:bg-white/10"><div className="h-full rounded-full bg-[#7088A9]" style={{width:`${total?x.value/total*100:0}%`}}/></div></div>)}
    </div></section>
  </div>;
}
