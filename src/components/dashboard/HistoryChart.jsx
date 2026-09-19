import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

export default function HistoryChart({ data = [] }) {
  if (!data.length) {
    return (
      <p className="py-10 text-center text-base text-muted-foreground">
        Belum ada data latihan minggu ini.
      </p>
    );
  }

  const peak = Math.max(...data.map((d) => d.value));

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 0, bottom: 0, left: 0 }}
        >
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 14 }}
            dy={6}
          />
          <YAxis hide domain={[0, peak * 1.25]} />
          <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={30}>
            {data.map((d) => (
              <Cell
                key={d.day}
                fill={d.value === peak ? "var(--chart-1)" : "var(--chart-3)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
