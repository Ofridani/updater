import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AlertResponseDto } from './dto/alert-response.dto';
import { CreateAlertDto } from './dto/create-alert.dto';
import {
  BannerAlertsQueryDto,
  PopupAlertsQueryDto,
  QueryAlertsDto,
} from './dto/query-alerts.dto';
import { AlertsService } from './alerts.service';

@ApiTags('alerts')
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new alert' })
  @ApiCreatedResponse({
    description: 'The created alert.',
    type: AlertResponseDto,
  })
  create(@Body() createAlertDto: CreateAlertDto) {
    return this.alertsService.create(createAlertDto);
  }

  @Get()
  @ApiOperation({ summary: 'List alerts' })
  @ApiOkResponse({
    description: 'Alerts filtered by the provided query parameters.',
    type: AlertResponseDto,
    isArray: true,
  })
  findAll(@Query() query: QueryAlertsDto) {
    return this.alertsService.findAll(query);
  }

  @Get('banner')
  @ApiOperation({ summary: 'List active incident alerts for banner display' })
  @ApiOkResponse({
    description: 'Active incident alerts filtered by streams for the banner component.',
    type: AlertResponseDto,
    isArray: true,
  })
  findBannerAlerts(@Query() query: BannerAlertsQueryDto) {
    return this.alertsService.findBannerAlerts(query.streams);
  }

  @Get('popup')
  @ApiOperation({ summary: 'List unseen current alerts for popup display' })
  @ApiOkResponse({
    description:
      'Unseen alerts for a user, filtered by streams for the popup component queue.',
    type: AlertResponseDto,
    isArray: true,
  })
  findPopupAlerts(@Query() query: PopupAlertsQueryDto) {
    return this.alertsService.findPopupAlerts(query.userId, query.streams);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one alert by id' })
  @ApiParam({
    name: 'id',
    description: 'Mongo ObjectId of the alert.',
    example: '67e76af4f7ddf8acac620001',
  })
  @ApiOkResponse({
    description: 'The requested alert.',
    type: AlertResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.alertsService.findOne(id);
  }
}
