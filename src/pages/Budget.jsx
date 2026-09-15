import { actualBudget, budgetStatus } from "../utils/calculations";
import BudgetVsActual from "../components/BudgetVsActual";
import GoalsProgress from "../components/GoalsProgress";
export default function Budget({selected}) {
  const actual=actualBudget(selected), budget=Number(selected?.Budget)||0, previous=Number(selected?.["Budget Previous"])||0;
  const status=budgetStatus(selected);
  return <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-4">
      {[["Budget",budget],["Actual",actual],["Previous Budget",previous],["Balance",Number(selected?.Balance)||0]].map(([k,v])=><div key={k} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-[#212743]"><p className="text-sm text-slate-500">{k}</p><p className="mt-2 text-2xl font-black dark:text-white">${v.toLocaleString()}</p></div>)}
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-[#212743]"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-wider text-[#7088A9]">Budget control</p><h2 className="mt-1 text-xl font-black dark:text-white">{status.label}</h2></div><span className={`rounded-full px-3 py-1 text-xs font-black ${status.tone==="good"?"bg-emerald-100 text-emerald-700":"bg-rose-100 text-rose-700"}`}>{budget-actual>=0?"Within limit":"Exceeded"}</span></div><div className="mt-4"><BudgetVsActual row={selected}/></div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-[#212743]"><p className="text-xs uppercase tracking-wider text-[#7088A9]">Goals</p><h2 className="mt-1 text-xl font-black dark:text-white">Goal progress</h2><div className="mt-5"><GoalsProgress row={selected}/></div></section>
    </div>
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-[#212743]"><h2 className="text-xl font-black dark:text-white">Budget composition</h2><div className="mt-4 grid gap-3 sm:grid-cols-4">{["Needs","Savings","Goal","Debts"].map(k=><div key={k} className="rounded-xl bg-slate-50 p-4 dark:bg-white/5"><p className="text-sm text-slate-500">{k}</p><p className="mt-1 text-lg font-black dark:text-white">${(Number(selected?.[k])||0).toLocaleString()}</p></div>)}</div></section>
  </div>;
}
