## Awalan

Mengingat waktu terbatas dan NestJS bukan merupakan framework yang menjadi main expertise saya, kita akan memilih project dengan scope yang terbatas tetapi tetap memenuhi kriteria minimum, serta memiliki value proposition yang jelas secara teknis.   

Saya memutuskan untuk memilih project sistem manajemen booking acara, mengingat project seperti ini bisa dianggap fungsional dengan scope yang terbatas dan jumlah entitiy (serta relasi) yang tidak banyak, tetapi tetap memiliki challenge tersendiri yang nyata (race condition, concurrency handling).

Dokumen ini juga akan ditulis dengan format yang tidak formal demi kecepatan development dan ketepatan submission.

## Spesifikasi Proyek

Mengingat ini adalah domain yang umum dan cukup relate dengan kehidupan sehari-hari, fase _domain modeling_ pada project ini seharusnya tidak terlalu rumit.

Untuk use case, alur fitur dirangkum secara ringkas per modul agar langsung berfokus ke flow bisnis dan penanganan konkurensi tanpa format berbelit-belit.

Tapi sebelum itu kita perlu mendefinisika entity apa saja yang terlibat di domain aplikasi ini.

### Tech Stacks
Sesuai dengan arahan untuk challenge ini, kita akan memakai NestJS sebagai backend framework. Untuk keputusan library pendamping lain, saya akan mengikuti dokumentasi resmi dari docs NestJS untuk memilih library dengan support dan dokumentasi paling baik, yaitu:

- nestjs/config untuk env config management
- class-validator untuk parsing env dan validasi input 
- typeorm untuk orm dan manajemen skema database
- nestjs/passport untuk memudahkan autentikasi JWT
- supertest dan vitest untuk testing 
- nestjs/schedule untuk background job 

### Struktur Proyek
Ini merupakan desain awal, proyek
```
ticketeer-api/
├─ .devdocs/
│  ├─ README.md
├─ src/
│  ├─ main.ts
│  ├─ app.module.ts
│  ├─ app.controller.ts
│  ├─ app.controller.spec.ts
│  ├─ app.service.ts
│  ├─ common/
│  │  ├─ decorators/
│  │  ├─ dto/
│  │  ├─ enums/
│  │  ├─ errors/
│  │  ├─ filters/
│  │  ├─ guards/
│  │  ├─ interfaces/
│  ├─ config/
│  ├─ database/
│  ├─ modules/
│  │  ├─ auth/
│  │  ├─ events/
│  │  ├─ orders/
│  │  ├─ tickets/
│  │  ├─ users/
│  ├─ test/
├─ package.json
├─ README.md
```

### Error Handling
Untuk memudahkan error matching, handling, dan filtering, kita akan mendefinisikan sebuah custom error class bernama DomainException, yang diturunkan dari kelas HttpException (sehingga mempermudah handling di response boundary nantinya). 

Nantinya kita akan menurunkan DomainException ini untuk setiap Domain Error spesifik (seperti QuotaExceededException) yang akan kita gunakan untuk pemodelan failure modes pada usecases. Selain itu, saya pikir akan merasa terbantu jika kita juga menurukan DomainException ke bentuk yang generic seperti EntityNotFoundException yang bisa digunakan di berbagai macam modul ketika kita menemui kasus dimana sebuah entitas tidak ditemukan.


setiap module dalam modules kurang lebih akan memiliki struktur seperti ini

```
modules/
├─ <nama fitur>/ 
│  ├─ domain/
│  │  ├─ errors/ --> custom domain error 
│  │  ├─ ports/ --> berisi kontrak (berupa abstract class) yang akan diimplementasikan di infra
│  ├─ dto/ --> bentuk request dan response (diimplementasikan dalam bentuk class)
│  ├─ entities/ --> entitas (annnotated dengan ORM decorators)
│  ├─ infra/ --> implementasi dari ports
│  ├─ <nama fitur>.module.ts
```

Cross cutting concern yang berkaitan dengan error, seperti Validation error dan request parsing, akan dihandle oleh ValidationPipe (app.useGlobalPipes(...)).

Kita juga akan memakai global filter (app.useGlobalFilters(...)) untuk menangkap dan formatting error di boundary

### Response Envelope Convention
Untuk predictability dan ease of use, kita akan menggunakan wrapper type yang uniform untuk respons, 

Ada beberapa kasus yang harus kita pikirkan, yaitu:
- Success (data) envelope
- Pagination Meta
- Error/Failure envelope 
   - Singular
   - Plural -> Validation error, dimana akan mengakumulasi error.



### Domain Modeling

#### Definisi
##### User
Pengguna sistem, role dibedakan menjadi 2:
- Organizer: penyelenggara event, memiliki akses untuk manajemen event
- Customer: user yang bisa memesan/reserve quota pada sebuah event

##### Event
Sebuah resource yang:
- memiliki quota/kapasitas tertentu. 
- memiliki rentang waktu tertentu yang digunakan sebagai tanggal operasional acara. 
- Event bisa berstatus:
   - DRAFT: jika sudah dibuat tapi belum dipublish, not accessible to Customer
   - PUBLISHED: jika sudah dipublish, accessiible to Customer
   - CANCELLED: jika Event dicancel oleh Organizer 
   - COMPLETED: jika Event sudah melewati rentang waktu operasional

##### Order
Merepresentasikan pesanan yang bisa dibuat oleh Customer untuk sebuah Event tertentu. 
- Sebuah order dilakukan oleh seorang Customer
- Berelasi dengan minimal 1 Tiket
- Setiap Tiket yang berelasi dalam 1 Order memiliki Ticket Tier yang sama 
- Memiliki hold-window (expiration-time) untuk fairness
- Order bisa berstatus:
   - PENDING_PAYMENT: Jika sebuah order sudah di-hold oleh Customer, tetapi belum dibayar
   - PAID: Jika order sudah dibayar
   - EXPIRED: Jika order tidak dibayar setelah melewati expiration-time/di luar dari hold-window
   - CANCELLED: Jika order dibatalkan oleh Customer 

##### Ticket
Merepresentasikan sebuah allocated quota dari sebuah Event yang dimiliki oleh seorang Customer.
- Ticket bisa berstatus:
   - ISSUED: status awal setelah dibuat dan masih dalam rentang waktu yang valid dari Event
   - ATTENDED: status setelah sebuah Ticket menghadiri acara 
   - VOID: status dari Ticket yang tidak diganti menjadi ATTENDED setelah lewat dari rentang waktu valid dari Event


##### Ticket Tier
Merepresentasikan kelas dari sebuah Ticket (misal: "Early Bird", "VIP", etc).

#### Relasi Kardinalitas
1. User (role==Organizer) has-many Event
2. User (role==Customer) has-many Order
3. Order has-many Ticket
4. Ticket has-one Ticket Tier

#### Schema (pseudo-schema in TS)
Demi readability kita akan mendefinisikan schema dengan menggunakan typescript. Ini merupakan desain awal, di implementasi tidak menutup kemungkinan akan ada column tambahan.

```ts

type UserRole = "CUSTOMER" | "ORGANIZER"

interface User {
   id: uuid
   email: string
   password: string  // (hashed)
   fullName: string
   role: UserRole
   orders: Order[]
   events: Event[] // jika role == ORGANIZER

   createdAt: Date
   updatedAt: Date
   deletedAt: Date | null
}

type EventStatus =  'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED' 

interface Event {
   id: uuid
   organizer: User // role = ORGANIZER

   title: string
   description: string
   venue: string
   eventDate: Date
   eventStatus: EventStatus

   tiers: TicketTier[]
   tickets: Ticket[]

   createdAt: Date
   updatedAt: Date
   deletedAt: Date | null
}

type OrderStatus = "PENDING_PAYMENT" | "PAID" | "EXPIRED" | "CANCELLED"

interface Order {
   id: uuid  // internal use untuk db
   orderNumber: string // generated by app
   customer: User // buyer


   tickets: Ticket[]
   ticketTier: TicketTier // karena setiap order hanya boleh berisi satu jenis tier 
   quantity: number // bisa pake generated columns?   
   totalAmount: number // bisa pake generated columns?

   orderStatus: OrderStatus
   expiresAt: Date // digunakan untuk hold window
   idempotencyKey: string | null // opsional dari client untuk mencegah duplikasi order saat retry

   createdAt: Date
   updatedAt: Date
}

type TicketStatus = "ISSUED" | "ATTENDED" | "VOID"

interface Ticket {
   id: uuid // internal db use
   ticketCode: string // generated by app
   event: Event
   order: Order
   ticketTier: TicketTier
   status: TicketStatus
   issuedAt: Date 
   admittedAt: Date | null

   updatedAt: Date
   createdAt: Date
   deletedAt: Date | null
}

interface TicketTier {
   id: uuid
   event: Event
   name: string
   price: number

   totalQuota: number
   maxPerUser: number
   availableQuota: number

   salesStart: Date // kapan tiket dengan tier ini bisa mulai dibeli
   salesEnd: Date // kapan pembelian tiket dengan tier ini akan ditutup

   orders: Order[]
   tickets: Ticket[]

   updatedAt: Date
   createdAt: Date
   deletedAt: Date | null
}

```

### Use Cases

Agar praktis dan nggak bertele-tele, flow use case dirangkum per modul dengan fokus ke flow utama, batasan bisnis, dan penanganan edge case (terutama soal race condition dan kuota).


#### 1. Autentikasi dan Akun (Auth dan Users)
Pemisahan hak akses antara Customer (pembeli tiket) dan Organizer (pengelola event), plus manajemen sesi JWT.

- Registrasi (UC-1.1): Endpoint pendaftaran untuk Customer dan Organizer (pembedanya di field role). Password di-hash dengan bcrypt, email wajib unik (kalau duplikat, throw 409 Conflict).
- Login (UC-1.2): Menerbitkan sepasang token, access_token (15 menit) dan refresh_token (7 hari). Hash refresh token disimpan di tabel user untuk validasi sesi. Kalau kredensial salah, return 401 Unauthorized secara generik.
- Refresh Token Rotation (UC-1.3): Saat client refresh token, buat pasangan token baru dan timpa hash lama di db. Mekanisme rotasi ini membuat kita tidak perlu tabel blacklist token. Kalau token invalid, expired, atau hash-nya tidak cocok, tolak 401 dan paksa login ulang.
- Logout (UC-1.4): Kosongkan hashedRefreshToken di database supaya refresh token yang dipegang client langsung hangus.
- Profil (/auth/me) (UC-1.5): Mengembalikan data user yang sedang login berdasarkan payload JWT.

#### 2. Manajemen Event dan Tier Tiket (Events dan Tiers)
Dikelola oleh Organizer untuk setup event dan kuota, serta menyediakan katalog untuk publik.

- Buat Event (UC-2.1): Khusus role ORGANIZER. Status awal selalu DRAFT dan otomatis terikat ke user yang sedang login.
- Setup Tier Tiket (UC-2.2): Satu event bisa punya banyak tier (VIP, Reguler, dll). Masing-masing punya harga, total kuota, batas maksimal pembelian per akun (maxPerUser), serta periode penjualan (salesStart dan salesEnd). Saat dibuat, availableQuota bernilai sama dengan totalQuota.
- Ownership Check (UC-2.3): Organizer hanya boleh mengubah, menghapus, atau menambah tier pada event miliknya sendiri. Akses ke event orang lain ditolak 403 Forbidden.
- Batal Event (Cascade Void) (UC-2.4): Kalau event dibatalkan (CANCELLED), semua tiket yang statusnya ISSUED otomatis diubah jadi VOID dalam transaksi yang sama agar nggak bisa dipakai masuk venue.
- Katalog Publik (UC-2.5): Publik dan customer bisa melihat daftar event yang berstatus PUBLISHED (mendukung search dan paginasi) beserta detail tier-nya. Event yang masih DRAFT disembunyikan.

#### 3. Reservasi Tiket dan Order (Concurrency dan War Tiket)
Bagian inti sistem untuk menangani lonjakan traffic pemesanan tiket tanpa takut overselling.

- Booking / War Tiket (POST /orders) (UC-3.1):
  - Validasi dasar: user role Customer, event status PUBLISHED, waktu pembelian berada di rentang salesStart–salesEnd, dan jumlah tiket tidak melebihi maxPerUser.
  - Penanganan Concurrency: Menggunakan atomic conditional update pada query database (memotong kuota hanya jika availableQuota masih mencukupi). Pendekatan ini dipilih alih-alih pessimistic write lock (SELECT FOR UPDATE) agar tidak mengunci antrean query sejak awal dan menjaga throughput sistem tetap optimal saat lonjakan traffic war tiket, dengan jaminan database constraint bahwa kuota tidak akan pernah minus.
  - Kalau kuota aman, order dibuat dengan status PENDING_PAYMENT dan diberi batas bayar 15 menit (expiresAt).
  - Kalau kuota habis / kalah cepat, query mengembalikan 0 baris dan sistem melempar 409 Conflict. Data kuota di db dijamin aman dan tidak pernah minus.
  - Idempotency: Client bisa mengirim header Idempotency-Key. Kalau ada retry jaringan dengan key yang sama, langsung kembalikan order yang sudah berhasil dibuat tanpa memotong kuota ulang.
- Simulasi Pembayaran (POST /orders/:id/pay) (UC-3.2):
  - Pengganti payment gateway untuk konfirmasi pelunasan.
  - Bayar sebelum 15 menit: status order jadi PAID, buat record Ticket sejumlah pembelian dengan kode tiket unik (TIK-YYYYMMDD-XXXX), status tiket diset ISSUED.
  - Bayar setelah 15 menit: tolak pembayaran (400 Bad Request), ubah status order jadi EXPIRED, dan kuota yang tertahan langsung dikembalikan ke tier.
- Batal Order Manual (UC-3.3): Customer bisa membatalkan order selama masih PENDING_PAYMENT. Kuota langsung balik ke tier. Order yang sudah PAID tidak bisa dibatalkan sembarangan.
- Riwayat Order (UC-3.4): Customer bisa mengecek daftar dan detail order miliknya beserta status dan hitung mundur sisa waktu pembayaran.

#### 4. Tiket dan Gate Check-in (Tickets dan Admission)
Distribusi e-ticket ke customer dan proses validasi pintu masuk oleh organizer.

- E-Ticket Customer (UC-4.1): Menampilkan tiket resmi yang sudah PAID beserta kode unik dan statusnya.
- Check-in di Pintu Masuk (UC-4.2): Petugas memvalidasi kode tiket di venue.
  - Kalau tiket masih ISSUED dan event-nya sesuai, ubah status jadi ATTENDED dan simpan timestamp admittedAt.
  - Kalau sudah berstatus ATTENDED, tolak (mencegah tiket dipakai lebih dari sekali).
  - Kalau status tiket VOID (karena event dibatalkan), tolak.
- Daftar Hadir (UC-4.3): Organizer bisa memantau rekap tiket yang diterbitkan dan daftar peserta yang sudah check-in di venue.

#### 5. Laporan Penjualan (Event Analytics)
- Rekap Penjualan (UC-5.1): Organizer bisa melihat ringkasan event miliknya: total tiket terjual, sisa kuota, serta total omzet kotor, baik secara agregat maupun rincian per tier.
- Proteksi Akses Laporan (UC-5.2): Endpoint ini dilindungi ownership guard agar tidak bisa diintip organizer lain.

#### 6. Background Scheduler (Auto-Release Kuota Expired)
Untuk menangani kasus di mana pembeli booking tiket tapi kemudian ditinggal begitu saja tanpa bayar atau klik cancel.

- Auto-Release Kuota Expired (UC-6.1):
  - Cron job jalan berkala setiap 1 menit.
  - Mencari order PENDING_PAYMENT yang sudah melewati expiresAt.
  - Dalam satu query atomik, ubah status order-order tersebut jadi EXPIRED dan kembalikan kuotanya ke kolom availableQuota pada masing-masing tier.
  - Catatan: Pendekatan scheduler cron ini dipilih karena simpel dan cukup untuk scope submission ini, meski untuk skala produksi lebih optimal menggunakan queue berbasis delay seperti BullMQ. Jika masih ada waktu, nantinya kita akan coba untuk mengimplementasikan delayed queue

#### Service, Endpoints, and DTOs modelling

Sesuai arsitektur yang sudah kita rancang, bagian ini memetakan kontrak response envelope, DTO, interface service, dan route endpoints.

_Kita akan memodelkan dalam kode typescript langsung untuk kemudahan, mirip seperti section sebelumnya._

##### 1. Generic Response Envelope dan Query Shape
Standard wrapper untuk response data singular dan pagination

```ts
interface DataResponse<T> {
  data: T;
}

interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

interface PaginationQueryDto {
  page?: number; // default: 1
  limit?: number; // default: 10, max: 100
  search?: string; // opsional: pencarian keyword
}
```

##### 2. Modul Events dan Tiers (Events, Tiers, Reports, dan Admission)
Mengelola event, kategori tiket, laporan omzet organizer, serta gate admission:

```ts
// DTOs
interface CreateEventDto {
  title: string;
  description: string;
  venue: string;
  eventDate: Date; // harus tanggal masa depan
}

interface UpdateEventDto extends Partial<CreateEventDto> {
  status?: EventStatus;
}

interface CreateTicketTierDto {
  name: string;
  price: number;
  totalQuota: number;
  maxPerUser: number;
  salesStart: Date;
  salesEnd: Date;
}

interface UpdateTicketTierDto {
  name?: string;
  price?: number;
  totalQuota?: number; // tidak boleh kurang dari tiket yang sudah terjual
}

interface EventReportTierBreakdown {
  tierId: string;
  tierName: string;
  price: number;
  totalQuota: number;
  availableQuota: number;
  soldCount: number;
  revenue: number;
}

interface EventReportDto {
  eventId: string;
  eventTitle: string;
  totalQuota: number;
  soldTickets: number;
  availableQuota: number;
  totalRevenue: number;
  tierBreakdown: EventReportTierBreakdown[];
}

// Service Interface
interface IEventsService {
  findPublishedEvents(pagination: PaginationQueryDto): Promise<PaginatedResult<Event>>;
  findOrganizerEvents(user: User, pagination: PaginationQueryDto): Promise<PaginatedResult<Event>>;
  getEventById(id: string): Promise<Event>;
  createEvent(user: User, dto: CreateEventDto): Promise<Event>;
  updateEvent(eventId: string, user: User, dto: UpdateEventDto): Promise<Event>;
  cancelEvent(eventId: string, user: User): Promise<Event>; // Cascade VOID tiket
  addTicketTier(eventId: string, user: User, dto: CreateTicketTierDto): Promise<TicketTier>;
  updateTicketTier(eventId: string, tierId: string, user: User, dto: UpdateTicketTierDto): Promise<TicketTier>;
  getEventReports(eventId: string, user: User): Promise<EventReportDto>;
  getEventAttendees(eventId: string, user: User, pagination: PaginationQueryDto): Promise<PaginatedResult<Ticket>>;
  admitAttendee(eventId: string, ticketId: string, user: User): Promise<Ticket>;
}

// Endpoint Mapping (EventsController)
// GET /events -> Public (findPublishedEvents)
// GET /events/organizer/my-events -> Guard(ORGANIZER) (findOrganizerEvents)
// GET /events/:id -> Public (getEventById)
// POST /events -> Guard(ORGANIZER) (createEvent)
// PATCH /events/:id -> Guard(ORGANIZER) (updateEvent)
// DELETE /events/:id -> Guard(ORGANIZER) (cancelEvent)
// POST /events/:id/tiers -> Guard(ORGANIZER) (addTicketTier)
// PATCH /events/:id/tiers/:tierId -> Guard(ORGANIZER) (updateTicketTier)
// GET /events/:id/reports -> Guard(ORGANIZER) (getEventReports)
// GET /events/:id/attendees -> Guard(ORGANIZER) (getEventAttendees)
// PATCH /events/:id/attendees/:ticketId/admit -> Guard(ORGANIZER) (admitAttendee)
```

##### 3. Modul Orders (War Tiket, Concurrency, Pembayaran) dan Scheduler
Menangani reservasi tiket dengan conditional update (anti-overselling), hold-window 15 menit, dan simulasi pembayaran:

```ts
// DTOs
interface ReserveTicketDto {
  quantity: number; // 1 <= quantity <= maxPerUser
  idempotencyKey?: string; // opsional untuk mencegah duplikasi order
}

interface PayOrderDto {
  paymentMethod?: string; // simulasi, misal BANK_TRANSFER
}

// Service Interface
interface IOrdersService {
  reserveTickets(eventId: string, tierId: string, user: User, dto: ReserveTicketDto): Promise<Order>;
  getOrderById(orderId: string, user: User): Promise<Order>;
  getMyOrders(user: User, pagination: PaginationQueryDto): Promise<PaginatedResult<Order>>;
  payOrder(orderId: string, user: User, dto: PayOrderDto): Promise<Order>;
  cancelOrder(orderId: string, user: User): Promise<Order>;
  releaseExpiredOrders(): Promise<number>; // dieksekusi oleh scheduler
}

// Endpoint Mapping (OrdersController dan EventReservationsController)
// POST /events/:id/tiers/:tierId/reserve -> Guard(CUSTOMER) (reserveTickets / War tiket)
// GET /orders/my -> Guard(CUSTOMER) (getMyOrders)
// GET /orders/:id -> Guard(JWT) (getOrderById)
// POST /orders/:id/pay -> Guard(CUSTOMER) (payOrder)
// DELETE /orders/:id -> Guard(CUSTOMER) (cancelOrder)

// Background Scheduler (OrdersScheduler)
// @Cron('*/1 * * * *') -> handleExpiredOrders(): memanggil releaseExpiredOrders()
```

##### 4. Modul Tickets (Sisi Customer)
Pengambilan e-ticket resmi bagi pengguna yang sudah menyelesaikan pembayaran:

```ts
// Service Interface
interface ITicketsService {
  getMyTickets(user: User, pagination: PaginationQueryDto): Promise<PaginatedResult<Ticket>>;
  getTicketById(ticketId: string, user: User): Promise<Ticket>;
  getTicketByCode(ticketCode: string, user: User): Promise<Ticket>;
}

// Endpoint Mapping (TicketsController)
// GET /tickets/my -> Guard(CUSTOMER) (getMyTickets)
// GET /tickets/:id -> Guard(JWT) (getTicketById)
// GET /tickets/code/:code -> Guard(JWT) (getTicketByCode)
```