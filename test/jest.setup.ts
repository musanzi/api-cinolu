import { Logger } from '@nestjs/common';

beforeEach(() => {
  Logger.overrideLogger(false);
});
