import { AppService } from './app.service';

describe('AppService.getHello', () => {
  it('returns the health greeting', () => {
    const appService = new AppService();

    const greeting = appService.getHello();

    expect(greeting).toBe('Hello World!');
  });
});
