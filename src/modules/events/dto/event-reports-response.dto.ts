import { EventReport } from '../domain/ports/events-repository.port.js';

export class EventReportTierBreakdownDto {
  tierId: string;
  tierName: string;
  price: number;
  totalQuota: number;
  availableQuota: number;
  soldCount: number;
  revenue: number;
}

export class EventReportsResponseDto {
  eventId: string;
  eventTitle: string;
  totalQuota: number;
  availableQuota: number;
  soldTickets: number;
  totalRevenue: number;
  tierBreakdown: EventReportTierBreakdownDto[];

  static fromReport(report: EventReport): EventReportsResponseDto {
    const dto = new EventReportsResponseDto();
    dto.eventId = report.eventId;
    dto.eventTitle = report.eventTitle;
    dto.totalQuota = report.totalQuota;
    dto.availableQuota = report.availableQuota;
    dto.soldTickets = report.soldTickets;
    dto.totalRevenue = report.totalRevenue;
    dto.tierBreakdown = report.tierBreakdown;
    return dto;
  }
}
