import { Activity, ArrowUpRight, CircleDollarSign, CreditCard, PiggyBank, Wallet } from "lucide-react";
import KpiCard from "../components/KpiCard";
import TrendChart from "../components/TrendChart";
import BreakdownDonut from "../components/BreakdownDonut";
import GoalsProgress from "../components/GoalsProgress";
import BudgetVsActual from "../components/BudgetVsActual";
import { costKeys, previousRow, pctChange, actualBudget } from "../utils/calculations";


// CSV export helper
const exportToCSV = (rows, filename = 'reconciliation-export.csv') => {
  if (!rows || !rows.length) {
    alert('Tidak ada data untuk di-export.');
    return;
  }

  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row || {}).forEach((key) => set.add(key));
      return set;
    }, new Set())
  );

  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value).replace(/"/g, '""');
    return /[",\n\r]/.test(str) ? `"${str}"` : str;
  };

  const csv = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => headers.map((h) => escapeCSV(row?.[h])).join(','))
  ].join('\r\n');

  const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export default function Dashboard({ rows, selected }) {
  const prev=previousRow(rows,selected);
  const kpis=[
    ["Total Inflow","Inflow",Wallet,"blue"],
    ["Total Costs","Costs",CreditCard,"slate"],
    ["Balance","Balance",CircleDollarSign,"teal"],
    ["Savings","Savings",PiggyBank,"violet"],
    ["Debts","Debts",Activity,"navy"]
  ];
  const trend=rows.map(r=>({...r,label:`${r.Month} ${String(r.Year).slice(-2)}`}));
  const costs=costKeys.map(k=>({name:k,value:Number(selected?.[k])||0})).filter(x=>x.value>0);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map(([label,key,Icon,accent])=><KpiCard key={key} label={label} value={`$${(Number(selected?.[key])||0).toLocaleString()}`} change={pctChange(Number(selected?.[key])||0,Number(prev?.[key])||0)} icon={Icon} accent={accent}/>)}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-[#212743] dark:shadow-dark">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#7088A9]">Performance</p><h2 className="mt-1 text-xl font-black text-[#181C3B] dark:text-white">Cash flow trend</h2></div>
          <div className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300">Inflow • Costs • Budget • Balance</div>
        </div>
        <TrendChart data={trend}/>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-[#212743] dark:shadow-dark">
          <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#7088A9]">Costs</p><h2 className="mt-1 text-xl font-black text-[#181C3B] dark:text-white">Where your money goes</h2></div>
          <BreakdownDonut data={costs}/>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-[#212743] dark:shadow-dark">
          <div className="mb-4"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#7088A9]">Goals</p><h2 className="mt-1 text-xl font-black text-[#181C3B] dark:text-white">Progress against plan</h2></div>
          <GoalsProgress row={selected}/>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-[#212743] dark:shadow-dark">
          <div className="mb-3"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#7088A9]">Budget</p><h2 className="mt-1 text-xl font-black text-[#181C3B] dark:text-white">Budget vs actual</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Actual = Needs + Savings + Goal + Debts</p></div>
          <BudgetVsActual row={selected}/>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-[#212743] dark:shadow-dark">
          <div className="mb-4"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#7088A9]">Monthly snapshot</p><h2 className="mt-1 text-xl font-black text-[#181C3B] dark:text-white">Allocation</h2></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {["Checking","Saving","Investments","Digital Craft","Rewards","Goals"].map(k=>
              <div key={k} className="rounded-xl bg-slate-50 p-4 dark:bg-white/5"><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{k}</p><p className="mt-1 font-black text-[#181C3B] dark:text-white">${(Number(selected?.[k])||0).toLocaleString()}</p></div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
