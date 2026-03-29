import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreateAlertDto } from './dto/create-alert.dto';
import {
  BannerAlertsQueryDto,
  PopupAlertsQueryDto,
  QueryAlertsDto,
} from './dto/query-alerts.dto';
import { AlertsService } from './alerts.service';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  create(@Body() createAlertDto: CreateAlertDto) {
    return this.alertsService.create(createAlertDto);
  }

  @Get()
  findAll(@Query() query: QueryAlertsDto) {
    return this.alertsService.findAll(query);
  }

  @Get('banner')
  findBannerAlerts(@Query() query: BannerAlertsQueryDto) {
    return this.alertsService.findBannerAlerts(query.streams);
  }

  @Get('popup')
  findPopupAlerts(@Query() query: PopupAlertsQueryDto) {
    return this.alertsService.findPopupAlerts(query.userId, query.streams);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.alertsService.findOne(id);
  }
}
