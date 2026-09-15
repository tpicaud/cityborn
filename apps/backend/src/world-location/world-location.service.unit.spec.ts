import { buildWorldLocation, WorldLocationIdSchema } from '@cityborn/api';
import { createMock } from '@golevelup/ts-jest';
import type { WorldLocationRepository } from './repositories/world-location.repository';
import { WorldLocationService } from './world-location.service';

jest.mock('@nestjs-cls/transactional', () => ({
  Transactional:
    () =>
    (
      _target: object,
      _propertyKey: string | symbol,
      descriptor: PropertyDescriptor,
    ) =>
      descriptor,
}));

const worldLocationId = (value: string) => WorldLocationIdSchema.parse(value);

function buildWorldLocationService() {
  const worldLocationRepository = createMock<WorldLocationRepository>();
  const worldLocationService = new WorldLocationService(
    worldLocationRepository,
  );

  return { worldLocationRepository, worldLocationService };
}

describe('WorldLocationService.get', () => {
  it('returns null when the location does not exist', async () => {
    const { worldLocationRepository, worldLocationService } =
      buildWorldLocationService();
    worldLocationRepository.existsById.mockResolvedValue(false);

    await expect(
      worldLocationService.get(worldLocationId('missing')),
    ).resolves.toBeNull();
  });

  it('returns only the identifier', async () => {
    const { worldLocationRepository, worldLocationService } =
      buildWorldLocationService();
    worldLocationRepository.existsById.mockResolvedValue(true);

    await expect(
      worldLocationService.get(worldLocationId('location-1')),
    ).resolves.toEqual({ id: worldLocationId('location-1') });
  });
});

describe('WorldLocationService queries', () => {
  it('loads a persisted location with its geometry', async () => {
    const { worldLocationRepository, worldLocationService } =
      buildWorldLocationService();
    const worldLocation = buildWorldLocation();
    worldLocationRepository.findById.mockResolvedValue(worldLocation);

    await expect(
      worldLocationService.getWithGeometry(worldLocation.id),
    ).resolves.toEqual(worldLocation);
    expect(worldLocationRepository.findById).toHaveBeenCalledWith(
      worldLocation.id,
      { geometry: true },
    );
  });

  it('queries an external identifier without branding it as a persisted ID', async () => {
    const { worldLocationRepository, worldLocationService } =
      buildWorldLocationService();
    const worldLocation = buildWorldLocation();
    worldLocationRepository.findBySource.mockResolvedValue(worldLocation);

    await expect(
      worldLocationService.findByExternalIdentifier('relation', '7444'),
    ).resolves.toEqual(worldLocation);
    expect(worldLocationRepository.findBySource).toHaveBeenCalledWith(
      { provider: 'relation', external_id: '7444' },
      { geometry: true },
    );
  });
});

describe('WorldLocationService.findOrCreate', () => {
  it('returns an existing location without creating a duplicate', async () => {
    const { worldLocationRepository, worldLocationService } =
      buildWorldLocationService();
    const worldLocation = buildWorldLocation();
    worldLocationRepository.findBySource.mockResolvedValue(worldLocation);

    await expect(
      worldLocationService.findOrCreate(worldLocation),
    ).resolves.toEqual(worldLocation);
    expect(worldLocationRepository.create).not.toHaveBeenCalled();
  });

  it('creates a missing location', async () => {
    const { worldLocationRepository, worldLocationService } =
      buildWorldLocationService();
    const worldLocation = buildWorldLocation();
    worldLocationRepository.findBySource.mockResolvedValue(null);
    worldLocationRepository.create.mockResolvedValue(worldLocation);

    await expect(
      worldLocationService.findOrCreate(worldLocation),
    ).resolves.toEqual(worldLocation);
    expect(worldLocationRepository.create).toHaveBeenCalledWith(worldLocation);
  });
});

describe('WorldLocationService.delete', () => {
  it('delegates deletion', async () => {
    const { worldLocationRepository, worldLocationService } =
      buildWorldLocationService();

    await worldLocationService.delete(worldLocationId('location-1'));

    expect(worldLocationRepository.delete).toHaveBeenCalledWith(
      worldLocationId('location-1'),
    );
  });
});
