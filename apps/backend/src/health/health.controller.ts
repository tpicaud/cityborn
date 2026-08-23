import { contract } from '@cityborn/api';
import { Controller } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';

@Controller()
export class HealthController {
  @TsRestHandler(contract.health)
  async handler() {
    return tsRestHandler(contract.health, {
      check: async () => ({ status: 200 as const, body: {} }),
    });
  }
}
