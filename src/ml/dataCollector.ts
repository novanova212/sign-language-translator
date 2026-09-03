export interface Sample {
  label: string;
  features: number[]; // 63 angka: 21 landmark x,y,z
}

let samples: Sample[] = [];

export function addSample(label: string, features: number[]) {
  samples.push({ label, features });
}

export function getCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  samples.forEach((s) => {
    counts[s.label] = (counts[s.label] ?? 0) + 1;
  });
  return counts;
}

export function getTotalCount(): number {
  return samples.length;
}

export function clearSamples() {
  samples = [];
}

export function exportToCSV() {
  const header = ["label", ...Array.from({ length: 21 }, (_, i) =>
    ["x", "y", "z"].map((axis) => `${axis}${i}`)
  ).flat()];

  const rows = samples.map((s) => [s.label, ...s.features].join(","));
  const csvContent = [header.join(","), ...rows].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "landmarks.csv";
  a.click();
  URL.revokeObjectURL(url);
}