import { EventStatus } from '../../../common/enums/index.js';
import { Event } from '../entities/event.entity.js';

export class EventResponseDto {
  id: string;
  organizerId: string;
  organizerName?: string;
  title: string;
  description: string;
  venue: string;
  eventDate: Date;
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(event: Event): EventResponseDto {
    const dto = new EventResponseDto();
    dto.id = event.id;
    dto.organizerId = event.organizerId;
    dto.organizerName = event.organizer?.fullName;
    dto.title = event.title;
    dto.description = event.description;
    dto.venue = event.venue;
    dto.eventDate = event.eventDate;
    dto.status = event.status;
    dto.createdAt = event.createdAt;
    dto.updatedAt = event.updatedAt;
    return dto;
  }
}
