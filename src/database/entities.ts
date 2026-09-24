import { Event } from "../modules/events/entities/event.entity.js";
import { TicketTier } from "../modules/events/entities/ticket-tier.entity.js";
import { Order } from "../modules/orders/entities/order.entity.js";
import { Ticket } from "../modules/tickets/entities/ticket.entity.js";
import { User } from "../modules/users/entities/user.entity.js";

export const entities = [
  User,
  Event,
  TicketTier,
  Order,
  Ticket,
];

export { User, Event, TicketTier, Order, Ticket };