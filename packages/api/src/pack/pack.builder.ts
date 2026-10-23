import type { z } from 'zod';
import {
  type CreatePack,
  CreatePackSchema,
  type FullPack,
  FullPackSchema,
  type Pack,
  PackSchema,
  type UpdatePack,
  UpdatePackSchema,
} from './pack.schema';

export function buildPack(
  overrides: Partial<z.input<typeof PackSchema>> = {},
): Pack {
  return PackSchema.parse({
    id: '00000000-0000-4000-8000-000000000010',
    name: 'Monuments',
    isPublished: true,
    ...overrides,
  });
}

export function buildFullPack(
  overrides: Partial<z.input<typeof FullPackSchema>> = {},
): FullPack {
  return FullPackSchema.parse({
    ...buildPack(),
    guessObjects: [],
    ...overrides,
  });
}

export function buildCreatePack(
  overrides: Partial<z.input<typeof CreatePackSchema>> = {},
): CreatePack {
  const pack: Pack = buildPack();

  return CreatePackSchema.parse({
    name: pack.name,
    isPublished: pack.isPublished,
    ...overrides,
  });
}

export function buildUpdatePack(
  overrides: Partial<z.input<typeof UpdatePackSchema>> = {},
): UpdatePack {
  return UpdatePackSchema.parse({
    ...buildPack(),
    ...overrides,
  });
}
