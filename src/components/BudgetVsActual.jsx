import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { actualBudget } from "../utils/calculations";

export default function BudgetVsActual({ row }) {
  const actual = actualBudget(row);
  const data = [
    { name: "Budget", value: Number(row.Budget)||0 },
    { name: "Actual", value: actual }
  ];
  const diff=(Number(row.Budget)||0)-actual;
  return (
    <div>
      <div className="mb-3 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-white/5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</p>
          <p className={`mt-1 text-lg font-black ${diff>=0?"text-emerald-500":"text-rose-500"}`}>
            {diff>=0 ? "Under budget" : "Over budget"}
          </p>
        </div>
        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
          {diff>=0 ? `$${diff.toLocaleString()} remaining` : `$${Math.abs(diff).toLocaleString()} over`}
        </p>
      </div>
      <div className="h-[230px]">
        <ResponsiveContainer>
          <BarChart data={data} margin={{top:10,right:10,left:0,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dfe5ec" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={v=>`$${(v/1000).toFixed(1)}k`} />
            <Tooltip formatter={v=>`$${Number(v).toLocaleString()}`} />
            <Legend />
            <Bar dataKey="value" name="Amount" fill="#7088A9" radius={[10,10,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
