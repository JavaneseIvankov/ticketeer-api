## Awalan

Mengingat waktu terbatas dan NestJS bukan merupakan framework yang menjadi main expertise saya, kita akan memilih project dengan scope yang terbatas tetapi tetap memenuhi kriteria minimum, serta memiliki value proposition yang jelas secara teknis.   

Saya memutuskan untuk memilih project sistem manajemen booking acara, mengingat project seperti ini bisa dianggap fungsional dengan scope yang terbatas dan jumlah entitiy (serta relasi) yang tidak banyak, tetapi tetap memiliki challenge tersendiri yang nyata (race condition, concurrency handling).

Dokumen ini juga akan ditulis dengan format yang tidak formal demi kecepatan development dan ketepatan submission.

## Spesifikasi Proyek

Mengingat ini adalah domain yang umum dan cukup relate dengan kehidupan sehari-hari, fase _domain modeling_ pada project ini seharusnya tidak terlalu rumit.

Saya akan menggunakan format
GIVEN, WHEN, THEN ([referensi](https://agilealliance.org/glossary/given-when-then/)) untuk merumuskan dan menjabarkan skenario usecases, karena format ini cukup compact dan mudah untuk dipakai.

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