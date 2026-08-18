# Tukar Kado 🎄

**[Coba sekarang di bukanpawkemon.github.io/tukar-kado](https://bukanpawkemon.github.io/tukar-kado/)** · [☕ Dukung di Trakteer](https://trakteer.id/BukanPawkemon)

Bikin undian tukar kado (Secret Santa) online, gratis dan gampang banget.
Nggak perlu daftar, nggak perlu email, nggak perlu akun. Data peserta kamu
tetap di browser sendiri, dan hasil undiannya dikirim lewat link
terenkripsi, bukan lewat kami.

![Halaman utama Tukar Kado](docs/screenshots/home-id.png)

## Kenapa beda dari yang lain

Kebanyakan alat undian nama minta kamu login dulu, masukin email semua
orang, atau nyimpen datanya di server mereka. Tukar Kado nggak gitu:

- **Nggak ada backend.** Semuanya jalan di browser kamu doang, nggak ada
  server yang tahu siapa dapat siapa.
- **Tiap link punya kunci enkripsi sendiri.** Begitu kamu klik "Hasilkan
  Pasangan", tiap peserta dapat kunci acak buat acara itu. Hasil
  pasangannya langsung dienkripsi ke dalam link, bukan disimpan di tempat
  lain.
- **Aman dibagikan lewat chat.** Data pasangan nyempil di fragment URL
  (`#...`) yang emang nggak pernah dikirim ke server, termasuk pas
  WhatsApp atau Telegram nampilin pratinjau link.
- **Bukaan dua tahap.** Nama pasangan nggak langsung nongol; peserta harus
  ketuk kotak hadiah dulu. Jadi nggak ada acara ke-spoiler cuma gara-gara
  ngelirik layar.

## Fitur

- Tambah peserta manual, lewat format teks singkat, atau tinggal upload
  CSV/Excel (kolom otomatis kedeteksi, header Indonesia atau Inggris)
- Atur aturan pasangan: paksa dapat orang tertentu, larang dapat orang
  tertentu, atau kelompokkan (misal satu keluarga) biar otomatis nggak
  saling dapat. Semua dihitung pakai algoritma matching yang presisi,
  jadi kalau ada kombinasi valid pasti ketemu, dan kalau nggak ada, kamu
  dikasih tahu alasan spesifiknya
- Kirim link lewat WhatsApp sekali tap, kode QR buat acara tatap muka,
  atau cetak jadi slip kertas
- Info acara opsional: nama acara, tanggal, batas waktu, kisaran budget,
  sampai link wishlist tiap peserta
- Backup/restore seluruh acara jadi satu file, berguna kalau data browser
  kamu ke-hapus
- Ada Bahasa Indonesia dan Inggris, masing-masing di URL sendiri

## Jalanin secara lokal

Proyek ini pakai [Yarn Berry](https://yarnpkg.com/) (`yarn@4.5.1`).

```bash
yarn              # install dependencies
yarn dev          # jalanin dev server
yarn build        # build buat produksi
yarn vitest       # jalanin test
```

## English

Tukar Kado ("gift exchange" in Indonesian) is a free Secret Santa /
gift-exchange generator, no signup, no email, no account needed. **Live at
[bukanpawkemon.github.io/tukar-kado](https://bukanpawkemon.github.io/tukar-kado/)**
(English available at [`/en/`](https://bukanpawkemon.github.io/tukar-kado/en/)).

It's fully client-side: there's no backend, and no server ever sees who's
been paired with whom. Each pairing round gets its own random encryption
key; every participant's assignment is packed and encrypted directly into
their unique link, using the URL fragment (the part after `#`) specifically
because browsers never transmit that part to a server, including when
WhatsApp or Telegram fetch a link preview.

Add participants manually, via a compact text format, or by importing a
CSV/Xlsx file with automatic column detection. Set pairing rules: force or
prevent specific pairings, or tag participants into groups (a family, a
couple) that should never draw each other. Share links over WhatsApp, QR
code, or printed slips. The reveal page is two-stage on purpose: a
participant's match never appears on screen until they deliberately tap to
open it.

```bash
yarn && yarn dev
```

## Kredit & Lisensi

Tukar Kado adalah pengembangan ulang dari
**[Secret Santa](https://github.com/arcanis/secretsanta) oleh Maël Nison**
(2015). Fork ini menulis ulang hampir semua bagian (kripto, algoritma
matching, i18n, dll), tapi ide dasarnya tetap dari proyek beliau. Makasih!

Ilustrasi hewan pesta (`static/party.webp`) diproses dengan bantuan Magnific AI.

Dilisensikan MIT, mengikuti lisensi asli:

> **Copyright © 2015 Maël Nison**
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

Nemu bug atau punya saran? [Buka issue](https://github.com/BukanPawkemon/tukar-kado/issues).
Lihat riwayat perubahan di [`CHANGELOG.md`](CHANGELOG.md).
