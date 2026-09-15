import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

export default function KpiCard({ label, value, change, icon: Icon, accent="blue" }) {
  const positive = change != null && change >= 0;
  const negative = change != null && change < 0;
  const accentMap = {
    blue: "from-[#004679] to-[#7088A9]",
    slate: "from-[#3D506B] to-[#9FB0C8]",
    navy: "from-[#181C3B] to-[#3D506B]",
    teal: "from-[#3B8F91] to-[#79C8C2]",
    violet: "from-[#765A9E] to-[#B99ADD]"
  };
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft transition hover:-translate-y-1 dark:border-white/10 dark:bg-[#212743] dark:shadow-dark">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accentMap[accent] || accentMap.blue}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-300">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-[#181C3B] dark:text-white">{value}</p>
        </div>
        <div className="rounded-xl bg-slate-100 p-2.5 text-[#004679] dark:bg-white/10 dark:text-[#9FB0C8]">
          {Icon && <Icon size={20} />}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1 text-xs font-bold">
        {change == null ? <Minus size={14} className="text-slate-400" /> :
          positive ? <ArrowUpRight size={14} className="text-emerald-500" /> :
          <ArrowDownRight size={14} className="text-rose-500" />}
        <span className={positive ? "text-emerald-600" : negative ? "text-rose-500" : "text-slate-400"}>
          {change == null ? "No previous month" : `${Math.abs(change).toFixed(1)}% vs prev. month`}
        </span>
      </div>
    </div>
  );
}
