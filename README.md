# Mading Digital RT 003 / RW 002 Desa Semidang Alas

Mading Digital adalah aplikasi web ringan untuk kebutuhan informasi komunitas RT/RW. Proyek ini terdiri dari:

- `index.html` — halaman publik warga.
- `admin.html` — panel pengurus untuk mengelola pengumuman dan transaksi kas.
- `js/app.js` — frontend publik + integrasi Google Apps Script.
- `js/admin.js` — panel admin + integrasi Google Apps Script.
- `css/style.css` — styling tambahan di luar utility Tailwind.
- `public/logo-pagaralam.png` — aset visual komunitas yang terinspirasi lingkungan Pagar Alam.
- `public/favicon.ico` — favicon.
- `README.md` — panduan deployment dan penggunaan.

> **Catatan aset:** `logo-pagaralam.png` pada paket ini merupakan logo komunitas yang dibuat khusus untuk aplikasi, bukan reproduksi logo resmi pemerintah.

---

## 1. Cara kerja aplikasi

Frontend berjalan sebagai file HTML/CSS/JavaScript statis. Penyimpanan data dilakukan melalui Google Apps Script (GAS) yang menggunakan Google Sheets sebagai database sederhana.

Alur sederhananya:

**Warga → `index.html` → `js/app.js` → Web App GAS → Google Sheets**

**Pengurus → `admin.html` → `js/admin.js` → Web App GAS → Google Sheets**

Aplikasi juga menyediakan mode demo lokal. Jika URL GAS belum diatur, halaman warga menampilkan data demo agar tampilan tetap dapat diuji.

---

# 2. Menyiapkan Google Sheets

1. Buat sebuah Google Spreadsheet baru, misalnya:

   `Mading Digital RT 003 RW 002`

2. Buka spreadsheet tersebut.

3. Salin **Spreadsheet ID** dari URL:

   `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`

4. Simpan ID tersebut. ID akan dimasukkan ke Google Apps Script pada langkah berikutnya.

---

# 3. Membuat Google Apps Script backend

## 3.1 Membuka Apps Script

Dari Google Drive:

1. Buat proyek baru di Google Apps Script, atau buka `https://script.google.com/`.
2. Buat project baru, misalnya:

   `Mading Digital RT003`

3. Buat file script default bernama `Code.gs`.

## 3.2 Tempel kode backend lengkap berikut

Kode berikut sudah mencakup:

- pembuatan sheet otomatis;
- endpoint `GET ?action=bootstrap`;
- penambahan pengumuman;
- penghapusan pengumuman;
- penambahan transaksi keuangan;
- penghapusan transaksi keuangan;
- validasi admin key;
- respons JSON;
- sorting data terbaru;
- sanitasi nilai dasar.

> **Penting:** ganti nilai `SPREADSHEET_ID` dengan ID Google Spreadsheet Anda.

```javascript
const SPREADSHEET_ID = 'PASTE_SPREADSHEET_ID_ANDA_DI_SINI';

const SHEETS = {
  announcements: {
    name: 'Announcements',
    headers: ['id', 'title', 'content', 'category', 'priority', 'date', 'created_at']
  },
  schedules: {
    name: 'Schedules',
    headers: ['id', 'title', 'date', 'time', 'location', 'type', 'description', 'created_at']
  },
  finance: {
    name: 'Finance',
    headers: ['id', 'date', 'description', 'type', 'amount', 'category', 'note', 'created_at']
  }
};

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'bootstrap';

    if (action === 'bootstrap') {
      return jsonResponse_({
        ok: true,
        data: getBootstrapData_()
      });
    }

    if (action === 'health') {
      return jsonResponse_({
        ok: true,
        data: {
          service: 'Mading Digital RT003',
          timestamp: new Date().toISOString()
        }
      });
    }

    return jsonResponse_({
      ok: false,
      error: 'Action GET tidak dikenali.'
    });
  } catch (error) {
    return jsonResponse_({
      ok: false,
      error: safeError_(error)
    });
  }
}

function doPost(e) {
  try {
    const body = parseJsonBody_(e);
    validateAdminKey_(body.key);

    const action = String(body.action || '');
    const payload = body.payload || {};

    switch (action) {
      case 'addAnnouncement':
        addAnnouncement_(payload);
        break;
      case 'deleteAnnouncement':
        deleteRowById_('announcements', payload.id);
        break;
      case 'addFinance':
        addFinance_(payload);
        break;
      case 'deleteFinance':
        deleteRowById_('finance', payload.id);
        break;
      default:
        throw new Error('Action POST tidak dikenali.');
    }

    return jsonResponse_({
      ok: true,
      message: 'Operasi berhasil.'
    });
  } catch (error) {
    return jsonResponse_({
      ok: false,
      error: safeError_(error)
    });
  }
}

function getBootstrapData_() {
  return {
    announcements: readSheetObjects_('announcements')
      .sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at))
      .slice(0, 100),

    schedules: readSheetObjects_('schedules')
      .sort((a, b) => new Date(`${b.date || '1970-01-01'}T${b.time || '00:00'}`) -
                       new Date(`${a.date || '1970-01-01'}T${a.time || '00:00'}`))
      .slice(0, 100),

    finance: readSheetObjects_('finance')
      .sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at))
      .slice(0, 100)
  };
}

function addAnnouncement_(payload) {
  const title = requiredText_(payload.title, 'Judul pengumuman', 120);
  const content = requiredText_(payload.content, 'Isi pengumuman', 1000);
  const category = optionalText_(payload.category, 'Umum', 80);
  const priority = ['normal', 'high'].includes(String(payload.priority)) ? String(payload.priority) : 'normal';

  appendObject_('announcements', {
    id: createId_('ANN'),
    title,
    content,
    category,
    priority,
    date: new Date().toISOString(),
    created_at: new Date().toISOString()
  });
}

function addFinance_(payload) {
  const date = requiredText_(payload.date, 'Tanggal', 20);
  const description = requiredText_(payload.description, 'Keterangan', 160);
  const type = ['income', 'expense'].includes(String(payload.type)) ? String(payload.type) : '';
  const amount = Number(payload.amount);
  const category = optionalText_(payload.category, 'Kas RT', 80);
  const note = optionalText_(payload.note, '', 200);

  if (!type) {
    throw new Error('Jenis transaksi harus income atau expense.');
  }

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error('Nominal transaksi tidak valid.');
  }

  appendObject_('finance', {
    id: createId_('FIN'),
    date,
    description,
    type,
    amount,
    category,
    note,
    created_at: new Date().toISOString()
  });
}

function deleteRowById_(key, id) {
  const cleanId = requiredText_(id, 'ID', 100);
  const sheet = getSheet_(key);
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    throw new Error('Data tidak ditemukan.');
  }

  const headers = data[0].map(String);
  const idIndex = headers.indexOf('id');

  if (idIndex < 0) {
    throw new Error('Kolom id tidak ditemukan.');
  }

  for (let row = data.length - 1; row >= 1; row--) {
    if (String(data[row][idIndex]) === cleanId) {
      sheet.deleteRow(row + 1);
      return;
    }
  }

  throw new Error('Data dengan ID tersebut tidak ditemukan.');
}

function readSheetObjects_(key) {
  const sheet = getSheet_(key);
  const values = sheet.getDataRange().getValues();

  if (!values.length) {
    return [];
  }

  const headers = values[0].map(String);
  return values.slice(1)
    .filter(row => row.some(value => String(value).trim() !== ''))
    .map(row => {
      const object = {};
      headers.forEach((header, index) => {
        object[header] = normalizeSheetValue_(row[index]);
      });
      return object;
    });
}

function appendObject_(key, object) {
  const sheet = getSheet_(key);
  const headers = SHEETS[key].headers;
  sheet.appendRow(headers.map(header => object[header] === undefined ? '' : object[header]));
}

function getSheet_(key) {
  const config = SHEETS[key];
  if (!config) {
    throw new Error('Sheet key tidak valid.');
  }

  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(config.name);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(config.name);
    sheet.getRange(1, 1, 1, config.headers.length).setValues([config.headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, config.headers.length)
      .setFontWeight('bold')
      .setBackground('#e2e8f0');
  } else if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, config.headers.length).setValues([config.headers]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function parseJsonBody_(e) {
  if (!e || !e.postData || typeof e.postData.contents !== 'string') {
    throw new Error('Request body kosong.');
  }

  try {
    return JSON.parse(e.postData.contents);
  } catch (error) {
    throw new Error('Request body bukan JSON yang valid.');
  }
}

function validateAdminKey_(providedKey) {
  const configuredKey = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');

  if (!configuredKey) {
    throw new Error('ADMIN_KEY belum diset pada Script Properties Google Apps Script.');
  }

  if (!providedKey || String(providedKey) !== configuredKey) {
    throw new Error('Kunci admin tidak valid.');
  }
}

function requiredText_(value, label, maxLength) {
  const text = String(value === undefined || value === null ? '' : value).trim();

  if (!text) {
    throw new Error(`${label} wajib diisi.`);
  }

  if (text.length > maxLength) {
    throw new Error(`${label} terlalu panjang. Maksimal ${maxLength} karakter.`);
  }

  return text;
}

function optionalText_(value, fallback, maxLength) {
  const text = String(value === undefined || value === null ? fallback : value).trim();
  return text.slice(0, maxLength);
}

function normalizeSheetValue_(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value;
}

function createId_(prefix) {
  return `${prefix}-${Utilities.getUuid()}`;
}

function safeError_(error) {
  return error && error.message ? String(error.message) : String(error);
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### 3.3 Menyimpan Spreadsheet ID

Ubah:

```javascript
const SPREADSHEET_ID = 'PASTE_SPREADSHEET_ID_ANDA_DI_SINI';
```

menjadi ID spreadsheet Anda.

Contoh format:

```javascript
const SPREADSHEET_ID = '1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890';
```

Jangan membagikan ID spreadsheet jika spreadsheet tersebut berisi data sensitif.

---

# 4. Membuat ADMIN_KEY di Google Apps Script

Agar endpoint tulis tidak bisa digunakan sembarang orang:

1. Di Google Apps Script, buka **Project Settings**.
2. Cari **Script Properties**.
3. Tambahkan property:

   **Property:** `ADMIN_KEY`

   **Value:** buat kunci rahasia yang panjang, misalnya gabungan huruf, angka, dan simbol.

4. Simpan.

Kunci ini nanti dimasukkan di `admin.html` saat pengurus login. Kunci tidak disimpan permanen di source JavaScript.

> Untuk keamanan, jangan memasukkan `ADMIN_KEY` ke GitHub atau membagikannya di README publik.

---

# 5. Deploy Google Apps Script sebagai Web App

1. Klik **Deploy** → **New deployment**.
2. Pilih tipe **Web app**.
3. Atur:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Klik **Deploy**.
5. Izinkan akses Google saat diminta.
6. Salin URL Web App yang berakhiran:

   `/exec`

Contoh bentuk URL:

```text
https://script.google.com/macros/s/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/exec
```

Gunakan URL `/exec`, bukan URL `/dev`.

---

# 6. Menghubungkan URL GAS ke `app.js`

Buka:

```text
js/app.js
```

Cari:

```javascript
const DEFAULT_API_URL = '';
```

Isi dengan URL Web App GAS Anda:

```javascript
const DEFAULT_API_URL = 'https://script.google.com/macros/s/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/exec';
```

Simpan file.

Setelah itu `index.html` akan langsung mengambil data dari GAS.

---

# 7. Menghubungkan URL GAS ke `admin.js`

Buka:

```text
js/admin.js
```

Cari:

```javascript
const DEFAULT_API_URL = '';
```

Isi menggunakan URL `/exec` yang sama:

```javascript
const DEFAULT_API_URL = 'https://script.google.com/macros/s/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/exec';
```

Simpan file.

### Alternatif tanpa mengubah source

`admin.html` sudah menyediakan menu:

**Pengaturan koneksi API**

Masukkan URL Web App GAS → **Simpan**.

URL tersebut disimpan di `localStorage` browser dan akan dipakai oleh panel admin.

---

# 8. Menjalankan proyek secara lokal

Jangan mengandalkan klik dua kali file HTML (`file://`) untuk pengujian utama. Jalankan server HTTP lokal.

## Opsi A — Python

Pastikan Python sudah terpasang.

Buka terminal pada folder:

```text
mading-rt003
```

Lalu jalankan:

```bash
python -m http.server 5500
```

Jika Windows menggunakan `py`:

```bash
py -m http.server 5500
```

Buka browser:

```text
http://localhost:5500/
```

Panel admin:

```text
http://localhost:5500/admin.html
```

## Opsi B — VS Code Live Server

1. Buka folder `mading-rt003` di VS Code.
2. Pasang ekstensi **Live Server**.
3. Klik kanan `index.html`.
4. Pilih **Open with Live Server**.
5. Buka `admin.html` untuk panel admin.

---

# 9. Pengujian pertama

Setelah GAS sudah dideploy:

1. Buka `index.html`.
2. Pastikan status berubah menjadi **Terhubung ke Google Apps Script**.
3. Buka `admin.html`.
4. Masukkan `ADMIN_KEY`.
5. Setelah berhasil login, tambahkan satu pengumuman.
6. Tambahkan satu transaksi kas.
7. Kembali ke `index.html`.
8. Klik refresh browser.
9. Data harus muncul pada halaman publik.
10. Uji tombol hapus dari halaman admin.

---

# 10. Struktur Google Sheets

Script membuat sheet secara otomatis ketika endpoint pertama kali dipanggil.

## Announcements

| Kolom | Fungsi |
|---|---|
| id | ID unik pengumuman |
| title | Judul |
| content | Isi |
| category | Kategori |
| priority | normal / high |
| date | Waktu publikasi |
| created_at | Waktu pembuatan |

## Schedules

| Kolom | Fungsi |
|---|---|
| id | ID unik agenda |
| title | Judul agenda |
| date | Tanggal |
| time | Jam |
| location | Lokasi |
| type | Jenis agenda |
| description | Keterangan |
| created_at | Waktu pembuatan |

## Finance

| Kolom | Fungsi |
|---|---|
| id | ID unik transaksi |
| date | Tanggal |
| description | Keterangan |
| type | income / expense |
| amount | Nominal |
| category | Kategori |
| note | Catatan |
| created_at | Waktu pembuatan |

---

# 11. Cara mengelola jadwal kegiatan / ronda

Struktur proyek telah menyediakan tampilan jadwal pada `index.html` dan endpoint GAS sudah menyiapkan sheet `Schedules`.

Untuk menambah/mengelola agenda, data dapat dimasukkan ke sheet `Schedules` dengan struktur kolom yang sudah ditentukan:

- `id`
- `title`
- `date`
- `time`
- `location`
- `type`
- `description`
- `created_at`

Contoh data:

```text
SCH-001 | Ronda malam | 2026-10-25 | 22:00 | Pos ronda RT 003 | Keamanan | Jadwal ronda kelompok A | 2026-10-25T12:00:00.000Z
```

Panel admin pada versi ini sengaja difokuskan pada pengumuman dan keuangan sehingga pengurus dapat mengelola dua jenis data yang paling sering berubah tanpa UI yang terlalu padat. Jadwal tetap ditampilkan penuh pada halaman warga melalui sheet `Schedules`.

---

# 12. Praktik keamanan yang disarankan

- Jangan memasukkan `ADMIN_KEY` langsung ke `app.js`.
- Gunakan **Script Properties** untuk `ADMIN_KEY`.
- Jangan membagikan link Google Spreadsheet dengan akses edit ke warga.
- Backup Google Spreadsheet secara berkala.
- Gunakan URL deployment `/exec`.
- Jika deployment diubah atau dibuat ulang, perbarui URL di `app.js` dan `admin.js`.
- Untuk kebutuhan yang lebih sensitif, gunakan autentikasi Google Workspace atau backend yang mendukung session/token yang lebih kuat.

---

# 13. Checklist sebelum serah terima

- [ ] Spreadsheet sudah dibuat.
- [ ] `SPREADSHEET_ID` sudah benar.
- [ ] `ADMIN_KEY` sudah dibuat di Script Properties.
- [ ] GAS sudah dideploy sebagai Web App.
- [ ] Akses Web App sesuai kebutuhan komunitas.
- [ ] URL `/exec` sudah dimasukkan ke `app.js`.
- [ ] URL `/exec` sudah dimasukkan ke `admin.js`.
- [ ] Pengumuman dapat ditambah.
- [ ] Pengumuman dapat dihapus.
- [ ] Transaksi dapat ditambah.
- [ ] Transaksi dapat dihapus.
- [ ] Data tampil pada halaman warga.
- [ ] Tampilan sudah diuji di desktop dan HP.
- [ ] Backup Spreadsheet sudah dibuat.

---

# 14. Catatan teknis

Proyek ini tidak memerlukan `npm`, `Node.js`, bundler, atau framework build. Tailwind CSS digunakan melalui CDN sehingga proyek dapat langsung dijalankan sebagai website statis.

Google Apps Script menjadi API sekaligus lapisan akses ke Google Sheets. Request POST dikirim sebagai `text/plain` agar tidak membutuhkan preflight CORS `application/json` pada browser.

Mode demo pada `app.js` hanya bertujuan untuk preview antarmuka ketika URL GAS belum dikonfigurasi. Untuk penggunaan nyata, selalu sambungkan ke deployment GAS Anda.

---

## Lisensi dan penggunaan

Proyek ini dibuat untuk kebutuhan komunitas RT/RW. Anda bebas menyesuaikan nama wilayah, data, warna, logo, dan isi informasi sesuai kebutuhan pengurus.
