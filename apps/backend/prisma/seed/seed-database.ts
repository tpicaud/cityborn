import {
  type CreateUser,
  CreateUserSchema,
  type ThemeIcon,
  ThemeIconSchema,
} from '@cityborn/api';
import type { Prisma, PrismaClient, UserRole } from '@prisma/client';
import { hashPassword } from '../../src/auth/password-hashing';
import { defaultThemeIcon } from '../../src/theme/default-theme';

type Position = [number, number];

type BoundingBox = {
  west: number;
  south: number;
  east: number;
  north: number;
};

type SeedWorldLocation = {
  osmRelationId: string;
  name: string;
  displayName: string;
  centroid: Position;
  boundingBox: BoundingBox;
};

type SeedPersonality = {
  name: string;
  shortDescription: string;
  description: string;
  wikidataId: string;
  birthplace: SeedWorldLocation;
};

type SeedTheme = {
  name: string;
  icon: ThemeIcon;
};

type SeedPack = {
  id: string;
  name: string;
  description: string;
  image: string;
  theme: SeedTheme;
  personalities: SeedPersonality[];
};

type SeedUser = {
  username: string;
  email: string;
  role: UserRole;
};

const SEED_PASSWORD: string = 'Password123';

const ENTERTAINMENT: SeedTheme = {
  name: 'Divertissement',
  icon: defaultThemeIcon,
};

const MUSIC: SeedTheme = {
  name: 'Musique',
  icon: ThemeIconSchema.parse({
    name: 'ic:baseline-music-note',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55c-2.21 0-4 1.79-4 4s1.79 4 4 4s4-1.79 4-4V7h4V3z"/></svg>',
  }),
};

const SEED_THEMES: SeedTheme[] = [ENTERTAINMENT, MUSIC];

const PARIS: SeedWorldLocation = {
  osmRelationId: '7444',
  name: 'Paris',
  displayName: 'Paris, Île-de-France, France',
  centroid: [48.8566, 2.3522],
  boundingBox: { west: 2.224, south: 48.815, east: 2.47, north: 48.902 },
};

const LOS_ANGELES: SeedWorldLocation = {
  osmRelationId: '207359',
  name: 'Los Angeles',
  displayName: 'Los Angeles, Californie, États-Unis',
  centroid: [34.0537, -118.2428],
  boundingBox: { west: -118.668, south: 33.704, east: -118.155, north: 34.337 },
};

const NEW_YORK: SeedWorldLocation = {
  osmRelationId: '175905',
  name: 'New York',
  displayName: 'New York, État de New York, États-Unis',
  centroid: [40.7127, -74.006],
  boundingBox: { west: -74.259, south: 40.477, east: -73.7, north: 40.917 },
};

const LONDON: SeedWorldLocation = {
  osmRelationId: '175342',
  name: 'Londres',
  displayName: 'Londres, Angleterre, Royaume-Uni',
  centroid: [51.5074, -0.1278],
  boundingBox: { west: -0.51, south: 51.286, east: 0.334, north: 51.692 },
};

const SEED_PACKS: SeedPack[] = [
  {
    id: '5eed0000-0000-4000-8000-000000000001',
    name: 'Cinéma',
    description: 'Des stars du grand écran.',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Bowl_of_Popcorn_%28Unsplash%29.jpg/960px-Bowl_of_Popcorn_%28Unsplash%29.jpg',
    theme: ENTERTAINMENT,
    personalities: [
      {
        name: 'Marion Cotillard',
        shortDescription: 'Actrice française',
        description: 'Actrice française, Oscar de la meilleure actrice.',
        wikidataId: 'Q8927',
        birthplace: PARIS,
      },
      {
        name: 'Leonardo DiCaprio',
        shortDescription: 'Acteur américain',
        description: 'Acteur et producteur américain.',
        wikidataId: 'Q38111',
        birthplace: LOS_ANGELES,
      },
    ],
  },
  {
    id: '5eed0000-0000-4000-8000-000000000002',
    name: 'Pop',
    description: 'Des icônes de la musique pop.',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Smoke_and_light_beams_%28Unsplash%29.jpg/960px-Smoke_and_light_beams_%28Unsplash%29.jpg',
    theme: MUSIC,
    personalities: [
      {
        name: 'Lady Gaga',
        shortDescription: 'Chanteuse américaine',
        description: 'Chanteuse, autrice-compositrice et actrice américaine.',
        wikidataId: 'Q19848',
        birthplace: NEW_YORK,
      },
      {
        name: 'Adele',
        shortDescription: 'Chanteuse britannique',
        description: 'Chanteuse et autrice-compositrice britannique.',
        wikidataId: 'Q23215',
        birthplace: LONDON,
      },
    ],
  },
];

const SEED_USERS: SeedUser[] = [
  { username: 'admin', email: 'admin@cityborn.test', role: 'admin' },
  { username: 'player', email: 'player@cityborn.test', role: 'player' },
];

function toPolygon({
  west,
  south,
  east,
  north,
}: BoundingBox): Prisma.InputJsonObject {
  const ring: Position[] = [
    [west, south],
    [east, south],
    [east, north],
    [west, north],
    [west, south],
  ];
  return { type: 'Polygon', coordinates: [ring] };
}

async function seedWorldLocation({
  tx,
  location,
}: {
  tx: Prisma.TransactionClient;
  location: SeedWorldLocation;
}): Promise<string> {
  const geometry: Prisma.InputJsonObject = toPolygon(location.boundingBox);
  const fields: Prisma.WorldLocationCreateInput = {
    osm_type: 'relation',
    external_id: location.osmRelationId,
    name: location.name,
    display_name: location.displayName,
    addresstype: 'city',
    centroid: location.centroid,
    source: { provider: 'nominatim', external_id: location.osmRelationId },
  };
  const worldLocation: { id: string } = await tx.worldLocation.upsert({
    where: {
      osm_type_external_id: {
        osm_type: 'relation',
        external_id: location.osmRelationId,
      },
    },
    create: { ...fields, geometry: { create: { data: geometry } } },
    update: {
      ...fields,
      geometry: {
        upsert: { create: { data: geometry }, update: { data: geometry } },
      },
    },
    select: { id: true },
  });
  return worldLocation.id;
}

async function seedPersonality({
  tx,
  personality,
}: {
  tx: Prisma.TransactionClient;
  personality: SeedPersonality;
}): Promise<string> {
  const worldLocationId: string = await seedWorldLocation({
    tx,
    location: personality.birthplace,
  });
  const fields: Prisma.GuessObjectUncheckedCreateInput = {
    name: personality.name,
    short_description: personality.shortDescription,
    description: personality.description,
    source: { provider: 'wikidata', external_id: personality.wikidataId },
    world_location_id: worldLocationId,
  };
  const guessObject: { id: string } = await tx.guessObject.upsert({
    where: { name: personality.name },
    create: fields,
    update: fields,
    select: { id: true },
  });
  return guessObject.id;
}

async function seedPack({
  tx,
  pack,
  themeId,
}: {
  tx: Prisma.TransactionClient;
  pack: SeedPack;
  themeId: string;
}): Promise<void> {
  const guessObjectIds: string[] = await Promise.all(
    pack.personalities.map((personality: SeedPersonality) =>
      seedPersonality({ tx, personality }),
    ),
  );
  const guessObjects: { id: string }[] = guessObjectIds.map((id: string) => ({
    id,
  }));
  await tx.pack.upsert({
    where: { id: pack.id },
    create: {
      id: pack.id,
      name: pack.name,
      description: pack.description,
      image: pack.image,
      isPublished: true,
      themeId,
      guessObjects: { connect: guessObjects },
    },
    update: {
      name: pack.name,
      description: pack.description,
      image: pack.image,
      isPublished: true,
      themeId,
      guessObjects: { set: guessObjects },
    },
  });
}

async function seedTheme({
  tx,
  theme,
}: {
  tx: Prisma.TransactionClient;
  theme: SeedTheme;
}): Promise<{ id: string }> {
  const existingTheme: { id: string } | null = await tx.theme.findFirst({
    where: { name: { equals: theme.name, mode: 'insensitive' } },
    select: { id: true },
  });
  return (
    existingTheme ??
    tx.theme.create({
      data: { name: theme.name, icon: theme.icon },
      select: { id: true },
    })
  );
}

async function seedContent(tx: Prisma.TransactionClient): Promise<void> {
  await Promise.all(
    SEED_THEMES.map(async (theme: SeedTheme): Promise<void> => {
      const { id: themeId }: { id: string } = await seedTheme({ tx, theme });
      await Promise.all(
        SEED_PACKS.filter((pack: SeedPack) => pack.theme === theme).map(
          (pack: SeedPack) => seedPack({ tx, pack, themeId }),
        ),
      );
    }),
  );
}

async function seedUsers({
  tx,
  passwordHash,
}: {
  tx: Prisma.TransactionClient;
  passwordHash: string;
}): Promise<void> {
  await Promise.all(
    SEED_USERS.map((user: SeedUser) => {
      const credentials: CreateUser = CreateUserSchema.parse({
        username: user.username,
        email: user.email,
        password: SEED_PASSWORD,
      });
      const account: Prisma.UserCreateInput = {
        username: credentials.username,
        email: credentials.email,
        type: 'email',
        role: user.role,
        password: passwordHash,
        isVerified: true,
      };
      return tx.user.upsert({
        where: { username: credentials.username },
        create: account,
        update: account,
      });
    }),
  );
}

export async function seedDatabase(prisma: PrismaClient): Promise<void> {
  const passwordHash: string = await hashPassword(SEED_PASSWORD);
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await seedContent(tx);
    await seedUsers({ tx, passwordHash });
  });
}
