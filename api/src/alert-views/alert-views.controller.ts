import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AlertViewsService } from './alert-views.service';
import { AlertViewResponseDto } from './dto/alert-view-response.dto';
import { CreateAlertViewDto } from './dto/create-alert-view.dto';
import { QueryAlertViewsDto } from './dto/query-alert-views.dto';

@ApiTags('alert-views')
@Controller('alert-views')
export class AlertViewsController {
  constructor(private readonly alertViewsService: AlertViewsService) {}

  @Post()
  @ApiOperation({ summary: 'Create or upsert an alert view record' })
  @ApiCreatedResponse({
    description: 'The created or existing alert-view association.',
    type: AlertViewResponseDto,
  })
  create(@Body() createAlertViewDto: CreateAlertViewDto) {
    return this.alertViewsService.create(createAlertViewDto);
  }

  @Get()
  @ApiOperation({ summary: 'List alert views for a user' })
  @ApiOkResponse({
    description: 'Alert view records for the provided user id.',
    type: AlertViewResponseDto,
    isArray: true,
  })
  findByUserId(@Query() query: QueryAlertViewsDto) {
    return this.alertViewsService.findByUserId(query.userId);
  }
}
