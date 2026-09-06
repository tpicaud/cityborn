import { IdService } from './id.service';

describe('IdService.generateNanoId', () => {
  it('returns the requested number of numeric characters', () => {
    const idService = new IdService();

    const id = idService.generateNanoId(8);

    expect(id).toMatch(/^\d{8}$/);
  });

  it('uses six characters by default', () => {
    const idService = new IdService();

    const id = idService.generateNanoId();

    expect(id).toMatch(/^\d{6}$/);
  });
});

describe('IdService.generateUniqueNamesId', () => {
  it('returns three readable segments', () => {
    const idService = new IdService();

    const id = idService.generateUniqueNamesId();

    expect(id.split('-')).toHaveLength(3);
  });
});
