# Disiplin Finansial Mahasiswa

Sistem pencatatan keuangan mahasiswa berbasis misi belajar. Pengeluaran bertipe **Keinginan tidak langsung berlaku**: ia disimpan dalam status *terkunci* dan baru dihitung sebagai pengeluaran setelah pengguna menyelesaikan misi belajar (**Pomodoro** atau **Active Recall**).

Proyek 1 PABWE: backend Express.js + SQLite, frontend Vue 3, Clean Architecture dengan pendekatan Feature-First.

## Alur inti

1. Catat keinginan (misalnya boba atau skin game) dan pilih misi pembukanya.
2. Keinginan berstatus **terkunci**. Ia tidak mengurangi saldo dan tidak masuk pengeluaran bulanan.
3. Mulai sesi misi. Server mencatat waktu mulai dan menghitung waktu minimum yang harus berlalu.
4. Selesaikan misi. Server memverifikasi waktu, lalu (untuk Active Recall) skor minimal **70**.
5. Keinginan **terbuka** dan baru saat itu dihitung sebagai pengeluaran. Keinginan juga bisa **dibatalkan** (dana hemat).

Aturan yang ditegakkan server (bukan hanya tampilan):

| Aturan | Keterangan |
|---|---|
| Tidak ada endpoint unlock langsung | Satu-satunya jalan membuka keinginan adalah menyelesaikan sesi misi |
| Waktu diverifikasi server | Pomodoro: durasi penuh. Active Recall: minimal 15 detik per kartu |
| Pomodoro untuk membuka keinginan | Minimal 25 menit |
| Active Recall | Skor rata-rata minimal 70, jika tidak sesi berstatus *gagal* dan keinginan tetap terkunci |
| Jenis misi sesuai pilihan | Keinginan bermisi Pomodoro tidak dapat dibuka dengan Active Recall, dan sebaliknya |
| Atomik | Penyelesaian sesi dan pembukaan keinginan berjalan dalam satu transaksi database |

## Struktur

```
backend/
  src/
    core/            config, database, errors, middleware, security, utils (lintas fitur)
    features/
      auth/            domain · application · infrastructure · presentation
      transactions/    domain · application · infrastructure · presentation
      study-missions/  domain · application · infrastructure · presentation
      dashboard/       domain · application · infrastructure · presentation
    app.js           composition root (merakit semua modul dan dependensinya)
    database.js      skema + seed
    server.js        startServer() dan graceful shutdown
    index.js         titik masuk tanpa logika
  tests/             unit + integrasi (coverage 100%)
frontend/
  src/
    app/             router, layout, gaya global, pengelolaan sesi
    core/            http client, storage token, formatter
    shared/          komponen UI, composable, konstanta lintas fitur
    features/
      auth/ · transactions/ · study-missions/ · dashboard/
        domain · application · infrastructure · presentation
  tests/
```

Aturan dependensi (arah ke dalam): `presentation → application → domain`, dan `infrastructure` mengimplementasikan kebutuhan `application`. Lapisan **domain** berisi aturan bisnis murni tanpa Express, SQLite, Vue, atau HTTP. Use case menerima repository lewat constructor, dan perakitannya terjadi di `index.js` tiap fitur serta `app.js`.

## Prasyarat

- **Node.js 22.13 atau lebih baru** (backend memakai modul bawaan `node:sqlite`, tanpa dependensi native).
- npm.

## Menjalankan

### Backend

```bash
cd backend
cp .env.example .env      # sesuaikan JWT_SECRET
npm install
npm run dev               # atau: npm start   (http://localhost:5000)
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```

Saat pengembangan, Vite meneruskan `/api` ke backend (`VITE_PROXY_TARGET`). Untuk produksi, jalankan `npm run build` lalu sajikan folder `dist` dan arahkan `VITE_API_BASE_URL` ke alamat API.

### Mode demo (untuk video)

Pomodoro 25 menit terlalu lama untuk didemokan. Atur di `backend/.env`:

```
MISSION_TIME_SCALE=0.04
```

Pomodoro 25 menit menjadi 60 detik. Server **tetap memverifikasi** waktunya, dan timer di frontend mengikuti nilai dari server. Nilai `1` berarti waktu nyata.

## Pengujian

```bash
cd backend  && npm test     # 102 tes, coverage 100% (threshold ditegakkan)
cd frontend && npm test     # 41 tes: core, domain, store, komponen
```

Konfigurasi `vitest.config.js` backend menggagalkan `npm test` bila statements, branches, functions, atau lines di bawah 100%. Satu-satunya berkas yang dikecualikan adalah `src/index.js`, titik masuk dua baris yang hanya memanggil `startServer()` (sudah diuji penuh).

## Ringkasan API

Semua endpoint selain register dan login membutuhkan header `Authorization: Bearer <token>`.

| Method | Path | Fungsi |
|---|---|---|
| POST | `/api/auth/register` | Daftar |
| POST | `/api/auth/login` | Masuk |
| GET | `/api/auth/me` | Profil |
| PATCH | `/api/auth/budget` | Ubah anggaran bulanan |
| GET / POST | `/api/transactions` | Daftar / catat transaksi |
| GET / DELETE | `/api/transactions/:id` | Detail / hapus |
| POST | `/api/transactions/:id/cancel` | Batalkan keinginan terkunci |
| GET | `/api/missions/settings` | Aturan misi (time scale, skor lulus) |
| GET | `/api/missions/active-recall/decks` | Materi kartu |
| POST | `/api/missions/sessions` | Mulai sesi misi |
| POST | `/api/missions/sessions/:id/complete` | Selesaikan sesi (membuka keinginan bila lulus) |
| GET | `/api/missions/history` | Riwayat misi |
| GET | `/api/dashboard/summary` | Data dashboard dan grafik |
| GET | `/api/health` | Cek status |

Format error seragam: `{ "success": false, "message": "...", "errors": { "field": "..." } }`.

## Catatan migrasi dari versi sebelumnya

- **Hapus file database SQLite lama** sebelum menjalankan backend. Skema berubah (tabel `study_missions` kini menyimpan sesi, dan stempel waktu memakai ISO 8601 UTC). Skema baru dibuat otomatis.
- Endpoint `POST /api/transactions/:id/unlock` dihapus karena memungkinkan membuka keinginan tanpa misi.
- Frontend sebelumnya (Svelte) diganti Vue 3 dengan Vite, Pinia, Vue Router, dan Chart.js.
- Anggaran bulanan kini dihitung dari pengeluaran **bulan berjalan**, bukan seluruh riwayat.
- Hari pada grafik 7 hari dikelompokkan menurut zona waktu pengguna (`TIMEZONE_OFFSET_MINUTES`, bawaan WIB = 420).
- Sesi misi yang sedang berjalan tidak dipulihkan setelah halaman dimuat ulang (sesi dianggap ditinggalkan).
