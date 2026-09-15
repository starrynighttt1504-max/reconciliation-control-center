import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const money = v => `$${Number(v||0).toLocaleString()}`;

export default function TrendChart({ data, dark }) {
  return (
    <div className="h-[330px] w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#ffffff16" : "#dfe5ec"} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: dark ? "#cbd5e1" : "#64748b" }} />
          <YAxis tickFormatter={v => `$${(v/1000).toFixed(v >= 10000 ? 0 : 1)}k`} tick={{ fontSize: 11, fill: dark ? "#cbd5e1" : "#64748b" }} />
          <Tooltip formatter={money} contentStyle={{ borderRadius: 14, border: 0, boxShadow: "0 10px 30px rgba(0,0,0,.12)" }} />
          <Legend />
          <Line type="monotone" dataKey="Inflow" stroke="#004679" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="Costs" stroke="#E88985" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="Budget" stroke="#F2CE76" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="Balance" stroke="#79C8C2" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
