# Ticketeer - Event Booking Management API

Proyek ini dibuat sebagai submission untuk Technical Challenge posisi **Backend Engineer Intern (TypeScript)** di PT DOT Indonesia.

Aplikasi ini adalah REST API berbasis NestJS, TypeScript, dan PostgreSQL yang menangani sistem booking tiket acara (event ticketing), lengkap dengan manajemen kuota, autentikasi JWT multi-role, penanganan race condition saat pemesanan, serta E2E testing.

Catatan proses pengerjaan, jurnal desain domain, dan rancangan awal use-case dapat dilihat juga di [.devdocs/README.md](.devdocs/README.md).


## Arsitektur & Pattern yang Digunakan

Proyek ini menggunakan struktur modular NestJS yang dipadukan dengan pendekatan Ports and Adapters (Hexagonal Architecture) secara pragmatis.

Gambaran struktur folder proyek:
```
src/
├─ common/             # Decorators, guards, filters, response envelope
├─ config/             # Environment validation & app config
├─ database/           # Setup TypeORM & entity registry
├─ modules/
│  ├─ auth/           # Login, register, JWT strategies, token rotation
│  ├─ events/         # CRUD event, tier tiket, gate check-in, laporan omzet
│  ├─ orders/         # War tiket (concurrency), pembayaran, cron scheduler
│  ├─ tickets/        # E-ticket customer
│  ├─ users/          # Entity & repository user
```

Di dalam tiap modul fitur di src/modules, kodenya dipisah menjadi layer domain dan infrastruktur:
```
modules/
├─ <nama fitur>/
│  ├─ domain/
│  │  ├─ errors/      # Custom domain exceptions (e.g. QuotaExceededException)
│  │  ├─ ports/       # Kontrak repository berupa abstract class
│  ├─ dto/             # Request DTO (class-validator) & Response DTO
│  ├─ entities/        # TypeORM entity
│  ├─ infra/           # Implementasi port menggunakan TypeORM
│  ├─ <nama fitur>.controller.ts & service.ts
```

### Kenapa Memilih Pattern Ini? (Jawaban Poin 1.e & 1.f)

Ada beberapa alasan teknis kenapa saya memilih pola ini:

1. **Decoupling Logika Bisnis dari ORM (Dependency Inversion)**  
   Pada struktur NestJS standar, service sering kali langsung disuntik (*injected*) TypeORM @InjectRepository(). Dengan membuat abstraction port di domain/ports/ (misalnya OrdersRepository), service hanya bergantung pada kontrak abstraksi tersebut. Detail query TypeORM diisolasi di folder infra/. Kalau suatu saat ORM atau database ingin diganti, layer service tidak perlu disentuh.

2. **Kemudahan Testing (Testability)**  
   Karena service bergantung pada kontrak port (bukan implementasi konkrit TypeORM), kita bisa dengan sangat mudah melakukan unit testing dengan menyuntikkan mock repository sederhana tanpa perlu mengangkat koneksi database PostgreSQL atau in-memory DB.

3. **Pemisahan Domain yang Jelas**  
   Setiap fitur (auth, events, orders, tickets, users) menjadi modul yang independen dengan boundary yang jelas. Logika validasi dan aturan bisnis (seperti kuota, hold-window, dan status) terkapsulasi di domain modul masing-masing.

4. **Kontrak API yang terstruktur dan seragam (Envelope & Error Handling)**  
   - Format response sukses dibuat seragam menggunakan wrapper { data: ... } atau { data: [...], meta: { ... } } untuk paginasi.
   - Penanganan error tidak melempar HttpException acak di tengah service, melainkan menggunakan hirarki DomainException (seperti QuotaExceededException, SalesWindowClosedException) yang ditangkap oleh global filter AppHttpExceptionFilter dan dipetakan ke HTTP status code yang sesuai.

---

## Entitas & Alur Bisnis (CRUD yang Saling Berkaitan)

Sistem ini memiliki 5 entitas utama yang saling berelasi di PostgreSQL:

1. **User**: Menyimpan data pengguna dengan role ORGANIZER atau CUSTOMER. Password di-hash menggunakan bcrypt.
2. **Event**: Dibuat dan dikelola oleh Organizer. Memiliki status DRAFT, PUBLISHED, atau CANCELLED.
3. **TicketTier**: Kategori tiket dalam satu event (misal Early Bird, VIP). Memiliki batas kuota (totalQuota, availableQuota), maxPerUser, serta jadwal penjualan (salesStart, salesEnd).
4. **Order**: Pesanan tiket yang dibuat Customer saat reservasi kuota. Memiliki status PENDING_PAYMENT dengan batas waktu bayar (hold-window) 15 menit, PAID, CANCELLED, atau EXPIRED.
5. **Ticket**: Tiket resmi yang otomatis diterbitkan saat Order berstatus PAID. Memiliki kode unik (TIK-YYYYMMDD-XXXX) dan status ISSUED, ATTENDED, atau VOID.

### Keterkaitan Alur CRUD:
- **Organizer Flow**: Organizer mendaftar -> membuat Event -> menambah Ticket Tier -> mempublikasikan Event -> memvalidasi tiket peserta di venue (admit) -> melihat laporan omzet penjualan event.
- **Customer Flow**: Customer mendaftar -> melihat katalog Event yang terbit -> melakukan booking/reservasi kuota tiket (Order dibuat) -> melakukan pembayaran -> menerima e-ticket resmi.
- **Integritas Relasi**: Jika Organizer membatalkan event (DELETE /events/:id), sistem secara otomatis mengubah seluruh tiket aktif terkait menjadi VOID (cascade void).

---

## Penanganan Concurrency & Race Condition ("War Tiket")

Untuk mencegah masalah overselling saat banyak user memesan tiket dalam waktu bersamaan:

- **Atomic Conditional Decrement**: Alih-alih melakukan SELECT lalu UPDATE biasa (yang rentan race condition) atau pessimistic lock yang berat, pemotongan kuota dilakukan langsung di level query:
  ```sql
  UPDATE ticket_tiers
  SET "availableQuota" = "availableQuota" - :qty
  WHERE id = :tierId AND "availableQuota" >= :qty;
  ```
  Jika kuota tersisa tidak mencukupi, baris yang terpengaruh bernilai 0 dan sistem langsung melempar error 409 Conflict.
- **Database Constraint**: Kolom availableQuota di database dilindungi check constraint agar nilainya tidak bisa negatif.
- **Auto-Release Expired Order**: Menggunakan background cron scheduler (@nestjs/schedule) yang berjalan setiap 1 menit untuk memeriksa order yang belum dibayar melewati batas waktu 15 menit, mengubah statusnya menjadi EXPIRED, dan mengembalikan kuotanya ke tier terkait.

---

## Autentikasi JWT

- Menggunakan **Dual Token**:
  - accessToken: Berlaku 15 menit, digunakan untuk autorisasi request via header Authorization: Bearer <token>.
  - refreshToken: Berlaku 7 hari, digunakan untuk mendapatkan access token baru via endpoint /auth/refresh.
- **Refresh Token Rotation**: Nilai hash dari refresh token disimpan di database. Setiap kali refresh token digunakan, pasangan token baru dibuat dan hash di database diperbarui.
- **Role-Based Access Control**: Menggunakan custom decorator @Roles() dan RolesGuard untuk membedakan hak akses endpoint antara ORGANIZER dan CUSTOMER.

---

## Dokumentasi API

Dokumentasi API interaktif sudah terpasang via Swagger / OpenAPI:
- Swagger UI: http://localhost:8000/docs
- OpenAPI JSON: http://localhost:8000/docs-json (dapat langsung di-import ke Postman via menu Import -> Link)

### Ringkasan Endpoint

#### Auth (/api/v1/auth)
- POST /auth/register - Daftar user (CUSTOMER / ORGANIZER)
- POST /auth/login - Login (mendapatkan access & refresh token)
- POST /auth/refresh - Rotasi refresh token
- POST /auth/logout - Logout & hapus sesi (Protected)
- GET /auth/me - Ambil profil user saat ini (Protected)

#### Events (/api/v1/events)
- GET /events - Katalog event publik (filter, search, pagination)
- GET /events/:id - Detail event & daftar tier tiket (Public)
- GET /events/organizer/my-events - Event milik organizer login (Organizer)
- POST /events - Buat event baru (Organizer)
- PATCH /events/:id - Edit event (Organizer)
- DELETE /events/:id - Batalkan event & void tiket (Organizer)
- POST /events/:id/tiers - Tambah tier tiket (Organizer)
- PATCH /events/:id/tiers/:tierId - Edit tier tiket (Organizer)
- GET /events/:id/reports - Laporan omzet & sisa kuota event (Organizer)
- GET /events/:id/attendees - Daftar hadir tiket event (Organizer)
- PATCH /events/:id/attendees/:ticketId/admit - Check-in tiket di venue (Organizer)

#### Orders (/api/v1/orders)
- POST /events/:id/tiers/:tierId/reserve - Reservasi tiket / booking (Customer)
- GET /orders/my - Riwayat order customer (Customer)
- GET /orders/:id - Detail order & countdown pembayaran (Protected)
- POST /orders/:id/pay - Simulasi pembayaran & terbitkan tiket (Customer)
- DELETE /orders/:id - Batalkan pesanan & kembalikan kuota (Customer)

#### Tickets (/api/v1/tickets)
- GET /tickets/my - Daftar tiket milik customer (Customer)
- GET /tickets/:id - Detail tiket (Protected)
- GET /tickets/code/:code - Cek tiket via kode tiket unik (Protected)

---

## Setup & Menjalankan Aplikasi

1. **Clone repo dan install dependency**:
   ```bash
   git clone https://github.com/<username>/ticketeer-api.git
   cd ticketeer-api
   pnpm install
   ```

2. **Setup environment**:
   Salin file konfigurasi environment:
   ```bash
   cp .env.example .env.local
   ```

3. **Jalankan DB PostgreSQL**:
   ```bash
   docker compose up -d
   ```

4. **Jalankan Dev Server**:
   ```bash
   pnpm start:dev
   ```
   Aplikasi akan berjalan di http://localhost:8000.  
   Buka Swagger di http://localhost:8000/docs.

---

## Testing

Proyek ini dilengkapi unit test dan end-to-end (E2E) test menggunakan Vitest dan Supertest.

### E2E Test (Kriteria 1.d):
```bash
pnpm test:e2e
```

File pengujian E2E:
- test/auth.e2e-spec.ts: Menguji lengkap siklus token JWT (register, email conflict 409, login sukses, reject invalid password 401, endpoint /auth/me, token rotation, dan logout invalidation).
- test/concurrency.e2e-spec.ts: Menguji race condition war tiket (5 request bersamaan berebut kuota 2 tiket tanpa overselling), pembatalan order yang mengembalikan kuota, dan pembayaran order yang menerbitkan tiket resmi.
- test/app.e2e-spec.ts: Health check endpoint server & database.

### Menjalankan Unit Test:
```bash
pnpm test
```
