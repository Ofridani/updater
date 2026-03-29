import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { HealthResponseDto } from './common/dto/health-response.dto';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'Get API health information' })
  @ApiOkResponse({
    description: 'Basic health payload for the updater API.',
    type: HealthResponseDto,
  })
  getHealth() {
    return this.appService.getHealth();
  }
}
