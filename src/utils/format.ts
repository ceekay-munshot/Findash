export function fmtCr(value: number): string {
  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(value >= 10000 ? 1 : 2)}k cr`;
  }
  return `₹${value.toLocaleString("en-IN")} cr`;
}

export function fmtPct(num: number, den: number): string {
  if (!den) return "0%";
  return `${Math.round((num / den) * 100)}%`;
}

export function pct(num: number, den: number): number {
  if (!den) return 0;
  return Math.round((num / den) * 100);
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) =>
      r
        .map((cell) => {
          const s = String(cell ?? "");
          if (s.includes(",") || s.includes('"') || s.includes("\n")) {
            return `"${s.replace(/"/g, '""')}"`;
          }
          return s;
        })
        .join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
