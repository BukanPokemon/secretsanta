export const id = {
  language: {
    flag: "🇮🇩",
    name: "Bahasa Indonesia",
    id: "Indonesian",
  },
  errors: {
    needMoreParticipants: "Anda membutuhkan minimal 2 peserta",
    invalidPairs: "Tidak dapat menghasilkan pasangan yang valid dengan aturan saat ini. Silakan periksa aturan dan coba lagi.",
    multipleMustRules: "{{name}} memiliki lebih dari satu aturan HARUS — hanya boleh ada satu",
    conflictingRules: "{{name}} harus dipasangkan dengan {{target}}, tapi juga mengecualikan {{target}} — hapus salah satu aturan",
    duplicateMustTarget: "{{giverA}} dan {{giverB}} sama-sama memiliki aturan HARUS ke {{target}} — hanya satu pemberi yang bisa dipasangkan dengannya",
    noValidReceiverFor: "{{name}} tidak punya siapa pun lagi untuk diberi hadiah, setelah aturan saat ini diterapkan",
    noValidGiverFor: "Tidak ada yang boleh memberi hadiah kepada {{name}} dengan aturan saat ini",
    emptyName: "Nama kosong",
    duplicateName: "Nama duplikat: {{name}}",
    invalidRuleFormat: "Format aturan tidak valid: {{rule}}",
    unknownParticipant: "Peserta tidak dikenal dalam aturan: {{name}}",
    noValidReceivers: "Tidak ada penerima valid tersisa untuk peserta ini",
    line: "Baris {{number}}"
  },
  home: {
    vanity: 'Credits: <a href="https://github.com/arcanis/secretsanta" target="_blank" class="underline hover:text-gray-600">Github</a>',
    vanityUrl: "https://github.com/arcanis/secretsanta",
    sponsor: "Dukung saya di GitHub",
    title: "Perencana Secret Santa",
    explanation: [
      "Selamat datang! Alat ini akan membantu Anda mengatur pertukaran hadiah liburan dengan mudah.",
      "Tambahkan peserta secara manual atau unggah CSV dengan semua detail peserta (Nama, Alamat, Telepon, Petunjuk Hadiah, Catatan).",
      "Atur aturan pasangan untuk peserta (paksa pasangan tertentu atau hindari pasangan tertentu).",
      "Hasilkan pasangan Secret Santa secara otomatis.",
      "Setiap peserta menerima link unik yang menampilkan siapa yang harus mereka beri hadiah, lengkap dengan Petunjuk Hadiah, Alamat, Telepon, Catatan, dan instruksi opsional.",
      "Tidak perlu akun, email, atau backend — semuanya berjalan di browser Anda dan di-host di GitHub Pages.",
      "Nikmati pengalaman Secret Santa yang menyenangkan dan tanpa stres! 🎄",
      "Anda akan menerima link unik untuk setiap peserta, yang harus dibagikan sendiri (via email, Slack, dll). [Contoh link]"
    ]
  },
  pairing: {
    title: "Tugas Secret Santa Anda",
    explainer: "Link ini hanya untuk kamu. Tidak ada orang lain yang bisa melihat siapa yang harus kamu beri hadiah, dan tidak ada data tentang kamu yang dikumpulkan untuk menampilkan ini — semuanya terjadi langsung di browser kamu.",
    greeting: "Hai, <name/>!",
    tapToOpen: "Ketuk untuk membuka hadiahmu",
    assignment: "Selamat, <name/>! Anda telah dipilih untuk memberi hadiah kepada:",
    error: "Gagal memuat link ini. Link mungkin rusak atau terpotong saat dibagikan — coba minta pengatur acara untuk mengirim ulang link kamu.",
    startYourOwn: "Mulai Secret Santa sendiri!",
    address: "Alamat",
    phone: "Telepon",
    notes: "Catatan",
    wishlistLink: "Lihat wishlist",
    eventInfoTitle: "Info Acara",
    rulesReminder: "{{instructions}}"
  },
  participants: {
    title: "Peserta",
    generationWarning: "Penting: Setiap perubahan pada daftar peserta atau pengaturan akan membutuhkan pembuatan pasangan baru. Link lama tidak akan diperbarui.",
    addPerson: "Tambahkan Peserta",
    tryExample: "Coba Contoh",
    uploadSpreadsheet: "Unggah CSV atau Excel",
    downloadCsvTemplate: "Unduh template CSV",
    downloadXlsxTemplate: "Unduh template Excel",
    generatePairs: "Hasilkan Pasangan",
    enterName: "Masukkan nama peserta",
    editRules: "Edit aturan",
    removeParticipant: "Hapus peserta",
    rulesCount_one: "{{count}} aturan",
    rulesCount_other: "{{count}} aturan",
    switchToFormView: "Ubah ke tampilan formulir",
    switchToTextView: "Ubah ke tampilan teks"
  },
  rules: {
    title: "Aturan untuk {{name}}",
    hintLabel: "Petunjuk Hadiah",
    hintPlaceholder: "Masukkan petunjuk hadiah (opsional)",
    addressLabel: "Alamat",
    addressPlaceholder: "Masukkan alamat (opsional)",
    phoneLabel: "Telepon",
    phonePlaceholder: "Masukkan telepon (opsional)",
    notesLabel: "Catatan",
    notesPlaceholder: "Masukkan catatan tambahan (opsional)",
    wishlistLabel: "Link Wishlist",
    wishlistPlaceholder: "Masukkan URL wishlist (opsional)",
    groupLabel: "Grup",
    groupPlaceholder: 'misal: "Keluarga Budi" — anggota grup tidak akan saling dapat',
    addMustRule: "Paksa pasangan",
    addMustNotRule: "Hindari pasangan",
    mustBePairedWith: "Harus dipasangkan dengan",
    mustNotBePairedWith: "Tidak boleh dipasangkan dengan",
    selectParticipant: "Pilih peserta",
    removeRule: "Hapus aturan",
    cancel: "Batal",
    saveRules: "Simpan aturan"
  },
  links: {
    title: "Link untuk Dibagikan",
    warningParticipantsChanged: "Peringatan: Peserta atau aturan telah berubah sejak link ini dibuat.",
    resetAssignments: "Hasilkan ulang pasangan",
    shareInstructions: "Bagikan link ini hanya kepada pemberi hadiah yang bersangkutan",
    selfSpoilWarning: "Jangan buka link Anda sendiri — mengekliknya akan membocorkan siapa yang harus Anda beri hadiah. Salin setiap link dan kirimkan tanpa membukanya sendiri.",
    exportCSV: "Ekspor CSV",
    copySecretLink: "Salin link",
    linkCopied: "Berhasil disalin ke clipboard!",
    for: "untuk",
    whatsappMessage: "Halo {{name}}! Ini link Tukar Kado kamu 🎁\n{{link}}",
    sendWhatsApp: "Kirim via WhatsApp",
    copyAll: "Salin Semua Pesan",
    copyAllCopied: "Semua pesan berhasil disalin!",
    printSlips: "Cetak Slip",
    showQr: "Kode QR",
    qrModalTitle: "Kode QR untuk {{name}}",
    close: "Tutup",
    markSent: "Tandai sudah dikirim",
    sentLabel: "Terkirim",
    printSlipInstructions: "Pindai kode QR ini atau kunjungi link untuk melihat pasangan tukar kadomu",
    printSlipFallback: "Tidak bisa memindai? Kunjungi:"
  },
  settings: {
    title: "Pengaturan",
    eventName: "Nama Acara",
    eventNamePlaceholder: "misal: Tukar Kado Kantor",
    eventDate: "Tanggal Acara",
    exchangeDeadline: "Batas Waktu Tukar Kado",
    budgetRange: "Kisaran Anggaran",
    budgetMinPlaceholder: "Minimum",
    budgetMaxPlaceholder: "Maksimum",
    instructions: "Instruksi Tambahan",
    instructionsPlaceholder: "misal: anggaran, tanggal, lokasi...",
    instructionsHelp: "Instruksi ini akan ditampilkan kepada semua peserta di halaman tugas mereka. Singkat saja agar link tidak terlalu panjang.",
    backupTitle: "Cadangkan & Pulihkan",
    backupHelp: "Acara Anda hanya tersimpan di browser ini. Ekspor cadangan agar Anda bisa mengirim ulang link jika data browser terhapus.",
    exportEvent: "Ekspor Acara",
    importEvent: "Impor Acara",
    importConfirm: "Ini akan mengganti peserta, pasangan, dan pengaturan Anda saat ini. Lanjutkan?",
    importError: "Gagal membaca file — file ini sepertinya bukan cadangan acara Tukar Kado."
  },
  import: {
    title: "Impor Peserta",
    loading: "Membaca file...",
    errorReadingFile: "Gagal membaca file ini. Pastikan ini adalah file CSV atau Excel (.xlsx) yang valid.",
    errorEmptyFile: "File ini tidak memiliki baris data.",
    mappingTitle: "Cocokkan kolom Anda",
    blankHeader: "(kosong)",
    fieldIgnore: "Jangan impor",
    fieldName: "Nama",
    fieldAddress: "Alamat",
    fieldPhone: "Telepon",
    fieldHint: "Petunjuk Hadiah",
    fieldNotes: "Catatan",
    fieldWishlistUrl: "URL Wishlist",
    fieldGroupId: "Grup",
    previewTitle: "Pratinjau",
    rowNumber: "Baris {{number}}",
    morePreviewRows: "dan {{count}} baris lainnya tidak ditampilkan di sini — tetap akan diimpor",
    largeFileWarning: "Ada {{count}} baris — menghasilkan pasangan untuk grup sebesar ini mungkin butuh waktu sebentar.",
    summary: "{{valid}} siap diimpor, {{errors}} bermasalah (dilewati), {{blank}} baris kosong dilewati",
    confirmButton: "Impor {{count}} Peserta",
    errorMissingName: "Nama kosong",
    errorDuplicateName: "Nama duplikat",
    warningNumericPhone: "Nomor telepon ini tersimpan sebagai angka di spreadsheet — periksa kembali jangan sampai angka nol di depan hilang"
  },
  seo: {
    homeTitle: "Tukar Kado — Generator Undian Tukar Kado Online, Gratis & Tanpa Daftar",
    homeDescription: "Bikin undian tukar kado (kocok nama) online dalam hitungan menit. Tanpa daftar, tanpa email, tanpa akun — daftar peserta tetap rahasia, tersimpan langsung di browser kamu. Gratis dan mudah dipakai untuk kantor, keluarga, atau arisan.",
    guideTitle: "Cara Bikin Tukar Kado Online — Panduan Lengkap | Tukar Kado",
    guideDescription: "Panduan langkah demi langkah bikin undian tukar kado rahasia online: tambah peserta, atur aturan pasangan, kocok nama otomatis, lalu bagikan link rahasia lewat WhatsApp. Gratis, tanpa perlu daftar."
  },
  guide: {
    backToHome: "Kembali ke Beranda",
    title: "Cara Bikin Tukar Kado Online",
    intro: "Tukar Kado adalah alat gratis untuk bikin undian tukar kado (Secret Santa) online — tanpa daftar, tanpa email, tanpa akun. Hasil undian siapa-dapat-siapa tetap rahasia: datanya dienkripsi langsung di dalam link yang kamu bagikan, dan semuanya berjalan di browser tanpa ada yang dikirim ke server mana pun. Begini cara bikinnya, cuma butuh beberapa menit.",
    steps: [
      {
        title: "1. Tambahkan peserta",
        body: "Buka halaman utama dan ketik nama setiap peserta. Tekan Enter setelah tiap nama untuk lanjut menambah yang berikutnya. Kalau sudah punya daftar di spreadsheet, pakai \"Unggah CSV atau Excel\" saja — bisa daftar nama polos atau sheet lengkap dengan alamat, nomor HP, dan petunjuk hadiah. Belum punya daftar? Klik \"Coba Contoh\" dulu untuk lihat alurnya pakai data contoh."
      },
      {
        title: "2. Atur aturan pasangan (opsional)",
        body: "Klik ikon gerigi di sebelah nama untuk menambahkan petunjuk hadiah, alamat, nomor HP, atau link wishlist, atau untuk mengatur aturan pasangan: paksa pasangan tertentu, atau hindari pasangan tertentu. Kalau ada pasangan suami-istri atau saudara dalam satu undian, kasih mereka nama \"Grup\" yang sama — otomatis tidak akan saling dapat, tanpa perlu klik satu-satu aturan pengecualian."
      },
      {
        title: "3. Hasilkan pasangan",
        body: "Klik \"Hasilkan Pasangan.\" Tukar Kado langsung mencari kombinasi pasangan yang valid dan memenuhi semua aturan yang kamu atur. Kalau aturannya bikin kombinasi valid jadi mustahil — misalnya dua orang sama-sama dipaksa memberi ke orang yang sama — kamu akan dapat penjelasan spesifik aturan mana yang bermasalah, bukan cuma pesan error umum."
      },
      {
        title: "4. Bagikan link — secara rahasia",
        body: "Setiap peserta dapat link rahasia masing-masing. Kalau sudah isi nomor HP, tinggal tap \"Kirim via WhatsApp\" untuk kirim langsung ke tiap orang. Kalau tidak, salin link-nya dan kirim lewat cara apa saja — chat, email, atau slip cetak dengan kode QR untuk dipindai. Setiap link cuma menampilkan pasangan orang itu saja; orang lain tidak bisa melihatnya, dan sebaiknya kamu juga tidak membuka link milikmu sendiri kalau tidak mau kejutannya hilang."
      },
      {
        title: "5. Hari pembukaan",
        body: "Saat peserta membuka link-nya, mereka akan lihat penjelasan singkat dulu, lalu tombol buka hadiah — nama pasangannya baru muncul setelah mereka sendiri yang memilih untuk membukanya. Kalau kamu mengisi anggaran, tanggal, atau instruksi tambahan, itu semua juga akan muncul di sana."
      }
    ],
    faqTitle: "Pertanyaan yang Sering Ditanyakan",
    faq: [
      {
        question: "Apakah saya perlu bikin akun atau daftar dulu?",
        answer: "Tidak. Tidak ada pendaftaran, tidak ada login, tidak ada akun sama sekali. Tinggal buka halamannya dan langsung tambahkan peserta."
      },
      {
        question: "Apakah email peserta dikumpulkan?",
        answer: "Tidak ada email yang dikumpulkan atau dibutuhkan sama sekali. Link dibagikan langsung oleh kamu, lewat cara apa pun yang kamu mau — WhatsApp, chat, atau langsung ke orangnya."
      },
      {
        question: "Daftar peserta disimpan di mana?",
        answer: "Hanya di browser kamu sendiri, di perangkat kamu sendiri. Tidak pernah dikirim ke server — memang tidak ada servernya. Kalau data browser terhapus, gunakan fitur Ekspor Acara terlebih dahulu untuk menyimpan cadangan."
      },
      {
        question: "Bisakah orang lain tahu saya kebagian memberi hadiah ke siapa?",
        answer: "Tidak bisa. Hasil pasangan tiap peserta dienkripsi masing-masing dan hanya bisa dibaca lewat link rahasia milik orang itu sendiri. Bahkan pengatur acara pun tidak bisa tahu siapa dapat siapa hanya dengan melihat daftar link."
      },
      {
        question: "Apakah benar-benar gratis?",
        answer: "Ya, sepenuhnya gratis, tanpa batasan jumlah peserta atau jumlah acara."
      }
    ],
    ctaText: "Siap bikin tukar kado sendiri?",
    ctaButton: "Buat Tukar Kado Sekarang"
  }
};
