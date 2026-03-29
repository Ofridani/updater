import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      name: 'updater-api',
      status: 'ok',
      componentBundle: '/components/component.es.js',
    };
  }
}
