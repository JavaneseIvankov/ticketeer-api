export enum UserRole {
  ORGANIZER = 'ORGANIZER',
  CUSTOMER = 'CUSTOMER',
}

export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum TicketStatus {
  ISSUED = 'ISSUED',
  ATTENDED = 'ATTENDED',
  VOID = 'VOID',
}