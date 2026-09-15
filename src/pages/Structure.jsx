import BreakdownDonut from "../components/BreakdownDonut";
import { structureKeys } from "../utils/calculations";
export default function Structure({selected}) {
  const data=structureKeys.map(k=>({name:k,value:Number(selected?.[k])||0})).filter(x=>x.value>0);
  const total=data.reduce((a,x)=>a+x.value,0);
  return <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-[#212743]">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-[#7088A9]">Structure</p><h2 className="mt-1 text-2xl font-black dark:text-white">Fund allocation</h2>
      <BreakdownDonut data={data}/>
    </section>
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-[#212743]">
      <h3 className="text-lg font-black dark:text-white">Allocation details</h3>
      <div className="mt-4 space-y-3">{data.map(x=><div key={x.name} className="flex items-center justify-between rounded-xl bg-slate-50 p-4 dark:bg-white/5"><div><p className="font-bold dark:text-white">{x.name}</p><p className="text-xs text-slate-500">{total?((x.value/total)*100).toFixed(1):0}% of structure</p></div><p className="font-black dark:text-white">${x.value.toLocaleString()}</p></div>)}</div>
    </section>
  </div>;
}
