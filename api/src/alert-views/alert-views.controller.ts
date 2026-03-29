import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AlertViewsService } from './alert-views.service';
import { CreateAlertViewDto } from './dto/create-alert-view.dto';
import { QueryAlertViewsDto } from './dto/query-alert-views.dto';

@Controller('alert-views')
export class AlertViewsController {
  constructor(private readonly alertViewsService: AlertViewsService) {}

  @Post()
  create(@Body() createAlertViewDto: CreateAlertViewDto) {
    return this.alertViewsService.create(createAlertViewDto);
  }

  @Get()
  findByUserId(@Query() query: QueryAlertViewsDto) {
    return this.alertViewsService.findByUserId(query.userId);
  }
}
