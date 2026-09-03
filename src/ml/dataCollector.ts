// dataCollector.ts
// Simpan sample data lewat browser (bukan Python), lalu export ke CSV
// dengan format kolom yang SAMA PERSIS dengan yang dibaca training/train_model.py.

export interface Sample {
  label: string;
  features: number[]; // 128 angka: right_hand_prob, left_hand_prob, right(63), left(63)
}

let samples: Sample[] = [];

export function addSample(label: string, features: number[]) {
  if (features.length !== 128) {
    console.warn(
      `Fitur harus 128 angka (2 tangan), tapi dapat ${features.length}. Sample ini tetap disimpan, tapi cek lagi handDetection.ts.`
    );
  }
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

function buildHeader(): string[] {
  const header = ["label", "right_hand_prob", "left_hand_prob"];
  for (const side of ["right", "left"]) {
    for (let i = 0; i < 21; i++) {
      header.push(`${side}_x${i}`, `${side}_y${i}`, `${side}_z${i}`);
    }
  }
  return header;
}

export function exportToCSV() {
  const header = buildHeader();
  const rows = samples.map((s) => [s.label, ...s.features].join(","));
  const csvContent = [header.join(","), ...rows].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "my_dataset.csv";
  a.click();
  URL.revokeObjectURL(url);
}