export default function GoalsProgress({ row }) {
  const goals = [
    ["Home", "Home Plan"], ["Travel", "Travel Plan"], ["Drive", "Drive Plan"], ["Hobby", "Hobby Plan"]
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {goals.map(([actual, plan]) => {
        const a=Number(row?.[actual])||0, p=Number(row?.[plan])||0;
        const pct=p ? Math.min(100, Math.max(0, a/p*100)) : 0;
        return (
          <div key={actual} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800 dark:text-white">{actual}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">${a.toLocaleString()} / ${p.toLocaleString()}</p>
              </div>
              <span className="text-sm font-black text-[#004679] dark:text-[#9FB0C8]">{pct.toFixed(0)}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-[#004679] to-[#79C8C2]" style={{width:`${pct}%`}} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
