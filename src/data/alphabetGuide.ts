// alphabetGuide.ts
// Data referensi panduan isyarat A-Z.
// `image` menunjuk ke file di /public/guide/ — kamu perlu isi sendiri
// foto/ilustrasi asli sesuai sistem isyarat yang dipakai (SIBI/BISINDO/dll),
// supaya bentuk tangan yang ditampilkan akurat.

export interface SignEntry {
  letter: string;
  image: string; // path relatif dari /public, contoh: "/guide/a.png"
  tips: string; // deskripsi singkat posisi tangan, buat bantu selain gambar
}

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export const alphabetGuide: SignEntry[] = letters.map((letter) => ({
  letter,
  image: `/guide/${letter.toLowerCase()}.png`,
  tips: "", // TODO: isi deskripsi posisi tangan untuk huruf ini
}));