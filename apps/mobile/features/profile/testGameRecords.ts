import { GameRecord, SessionMode } from '@cityborn/types';

export const gameRecordsExample: GameRecord[] = [
  {
    id: 'game_001',
    mode: SessionMode.SOLO,
    createdAt: '2025-02-12T14:32:00.000Z',
    gameConfig: {
      categories: ['animals', 'fruits'] as any, // Remplace par ton type Category réel
      timer: 60,
      nbOfObjects: 5,
    },
    players: [
      {
        username: 'Alice',
        isGuest: false,
        id: 'player_001',
      },
    ],
    guessObjectsIds: ['obj_a1', 'obj_b2', 'obj_c3'],
    results: {
      player_001: {
        results: [
          { guessObjectId: 'obj_a1', distance: 12, points: 88 },
          { guessObjectId: 'obj_b2', distance: 30, points: 60 },
          { guessObjectId: 'obj_c3', distance: 5, points: 95 },
        ],
      },
    },
  },

  {
    id: 'game_002',
    mode: SessionMode.MULTI,
    createdAt: '2025-02-10T18:05:00.000Z',
    gameConfig: {
      categories: ['cities'] as any,
      timer: 45,
      nbOfObjects: 3,
    },
    players: [
      { username: 'Bob', isGuest: true },
      { username: 'Charlie', isGuest: false, id: 'player_010' },
    ],
    guessObjectsIds: ['city_01', 'city_02', 'city_03'],
    results: {
      guest_Bob: {
        results: [
          { guessObjectId: 'city_01', distance: 100, points: 20 },
          { guessObjectId: 'city_02', distance: 40, points: 55 },
          { guessObjectId: 'city_03', distance: 10, points: 90 },
        ],
      },
      player_010: {
        results: [
          { guessObjectId: 'city_01', distance: 80, points: 35 },
          { guessObjectId: 'city_02', distance: 20, points: 75 },
          { guessObjectId: 'city_03', distance: 5, points: 98 },
        ],
      },
    },
  },

  {
    id: 'game_003',
    mode: SessionMode.MULTI,
    createdAt: '2025-02-10T18:05:00.000Z',
    gameConfig: {
      categories: ['cities'] as any,
      timer: 45,
      nbOfObjects: 3,
    },
    players: [
      { username: 'Bob', isGuest: true },
      { username: 'Charlie', isGuest: false, id: 'player_010' },
    ],
    guessObjectsIds: ['city_01', 'city_02', 'city_03'],
    results: {
      guest_Bob: {
        results: [
          { guessObjectId: 'city_01', distance: 100, points: 20 },
          { guessObjectId: 'city_02', distance: 40, points: 55 },
          { guessObjectId: 'city_03', distance: 10, points: 90 },
        ],
      },
      player_010: {
        results: [
          { guessObjectId: 'city_01', distance: 80, points: 35 },
          { guessObjectId: 'city_02', distance: 20, points: 75 },
          { guessObjectId: 'city_03', distance: 5, points: 98 },
        ],
      },
    },
  },

  {
    id: 'game_004',
    mode: SessionMode.MULTI,
    createdAt: '2025-02-10T18:05:00.000Z',
    gameConfig: {
      categories: ['cities'] as any,
      timer: 45,
      nbOfObjects: 3,
    },
    players: [
      { username: 'Bob', isGuest: true },
      { username: 'Charlie', isGuest: false, id: 'player_010' },
    ],
    guessObjectsIds: ['city_01', 'city_02', 'city_03'],
    results: {
      guest_Bob: {
        results: [
          { guessObjectId: 'city_01', distance: 100, points: 20 },
          { guessObjectId: 'city_02', distance: 40, points: 55 },
          { guessObjectId: 'city_03', distance: 10, points: 90 },
        ],
      },
      player_010: {
        results: [
          { guessObjectId: 'city_01', distance: 80, points: 35 },
          { guessObjectId: 'city_02', distance: 20, points: 75 },
          { guessObjectId: 'city_03', distance: 5, points: 98 },
        ],
      },
    },
  },

  {
    id: 'game_005',
    mode: SessionMode.MULTI,
    createdAt: '2025-02-10T18:05:00.000Z',
    gameConfig: {
      categories: ['cities'] as any,
      timer: 45,
      nbOfObjects: 3,
    },
    players: [
      { username: 'Bob', isGuest: true },
      { username: 'Charlie', isGuest: false, id: 'player_010' },
    ],
    guessObjectsIds: ['city_01', 'city_02', 'city_03'],
    results: {
      guest_Bob: {
        results: [
          { guessObjectId: 'city_01', distance: 100, points: 20 },
          { guessObjectId: 'city_02', distance: 40, points: 55 },
          { guessObjectId: 'city_03', distance: 10, points: 90 },
        ],
      },
      player_010: {
        results: [
          { guessObjectId: 'city_01', distance: 80, points: 35 },
          { guessObjectId: 'city_02', distance: 20, points: 75 },
          { guessObjectId: 'city_03', distance: 5, points: 98 },
        ],
      },
    },
  },

  {
    id: 'game_006',
    mode: SessionMode.MULTI,
    createdAt: '2025-02-10T18:05:00.000Z',
    gameConfig: {
      categories: ['cities'] as any,
      timer: 45,
      nbOfObjects: 3,
    },
    players: [
      { username: 'Bob', isGuest: true },
      { username: 'Charlie', isGuest: false, id: 'player_010' },
    ],
    guessObjectsIds: ['city_01', 'city_02', 'city_03'],
    results: {
      guest_Bob: {
        results: [
          { guessObjectId: 'city_01', distance: 100, points: 20 },
          { guessObjectId: 'city_02', distance: 40, points: 55 },
          { guessObjectId: 'city_03', distance: 10, points: 90 },
        ],
      },
      player_010: {
        results: [
          { guessObjectId: 'city_01', distance: 80, points: 35 },
          { guessObjectId: 'city_02', distance: 20, points: 75 },
          { guessObjectId: 'city_03', distance: 5, points: 98 },
        ],
      },
    },
  },

  {
    id: 'game_007',
    mode: SessionMode.MULTI,
    createdAt: '2025-02-10T18:05:00.000Z',
    gameConfig: {
      categories: ['cities'] as any,
      timer: 45,
      nbOfObjects: 3,
    },
    players: [
      { username: 'Bob', isGuest: true },
      { username: 'Charlie', isGuest: false, id: 'player_010' },
    ],
    guessObjectsIds: ['city_01', 'city_02', 'city_03'],
    results: {
      guest_Bob: {
        results: [
          { guessObjectId: 'city_01', distance: 100, points: 20 },
          { guessObjectId: 'city_02', distance: 40, points: 55 },
          { guessObjectId: 'city_03', distance: 10, points: 90 },
        ],
      },
      player_010: {
        results: [
          { guessObjectId: 'city_01', distance: 80, points: 35 },
          { guessObjectId: 'city_02', distance: 20, points: 75 },
          { guessObjectId: 'city_03', distance: 5, points: 98 },
        ],
      },
    },
  },

  {
    id: 'game_008',
    mode: SessionMode.MULTI,
    createdAt: '2025-02-10T18:05:00.000Z',
    gameConfig: {
      categories: ['cities'] as any,
      timer: 45,
      nbOfObjects: 3,
    },
    players: [
      { username: 'Bob', isGuest: true },
      { username: 'Charlie', isGuest: false, id: 'player_010' },
    ],
    guessObjectsIds: ['city_01', 'city_02', 'city_03'],
    results: {
      guest_Bob: {
        results: [
          { guessObjectId: 'city_01', distance: 100, points: 20 },
          { guessObjectId: 'city_02', distance: 40, points: 55 },
          { guessObjectId: 'city_03', distance: 10, points: 90 },
        ],
      },
      player_010: {
        results: [
          { guessObjectId: 'city_01', distance: 80, points: 35 },
          { guessObjectId: 'city_02', distance: 20, points: 75 },
          { guessObjectId: 'city_03', distance: 5, points: 98 },
        ],
      },
    },
  },

  {
    id: 'game_009',
    mode: SessionMode.MULTI,
    createdAt: '2025-02-10T18:05:00.000Z',
    gameConfig: {
      categories: ['cities'] as any,
      timer: 45,
      nbOfObjects: 3,
    },
    players: [
      { username: 'Bob', isGuest: true },
      { username: 'Charlie', isGuest: false, id: 'player_010' },
    ],
    guessObjectsIds: ['city_01', 'city_02', 'city_03'],
    results: {
      guest_Bob: {
        results: [
          { guessObjectId: 'city_01', distance: 100, points: 20 },
          { guessObjectId: 'city_02', distance: 40, points: 55 },
          { guessObjectId: 'city_03', distance: 10, points: 90 },
        ],
      },
      player_010: {
        results: [
          { guessObjectId: 'city_01', distance: 80, points: 35 },
          { guessObjectId: 'city_02', distance: 20, points: 75 },
          { guessObjectId: 'city_03', distance: 5, points: 98 },
        ],
      },
    },
  },

  {
    id: 'game_010',
    mode: SessionMode.MULTI,
    createdAt: '2025-02-10T18:05:00.000Z',
    gameConfig: {
      categories: ['cities'] as any,
      timer: 45,
      nbOfObjects: 3,
    },
    players: [
      { username: 'Bob', isGuest: true },
      { username: 'Charlie', isGuest: false, id: 'player_010' },
    ],
    guessObjectsIds: ['city_01', 'city_02', 'city_03'],
    results: {
      guest_Bob: {
        results: [
          { guessObjectId: 'city_01', distance: 100, points: 20 },
          { guessObjectId: 'city_02', distance: 40, points: 55 },
          { guessObjectId: 'city_03', distance: 10, points: 90 },
        ],
      },
      player_010: {
        results: [
          { guessObjectId: 'city_01', distance: 80, points: 35 },
          { guessObjectId: 'city_02', distance: 20, points: 75 },
          { guessObjectId: 'city_03', distance: 5, points: 98 },
        ],
      },
    },
  },

  {
    id: 'game_011',
    mode: SessionMode.MULTI,
    createdAt: '2025-02-10T18:05:00.000Z',
    gameConfig: {
      categories: ['cities'] as any,
      timer: 45,
      nbOfObjects: 3,
    },
    players: [
      { username: 'Bob', isGuest: true },
      { username: 'Charlie', isGuest: false, id: 'player_010' },
    ],
    guessObjectsIds: ['city_01', 'city_02', 'city_03'],
    results: {
      guest_Bob: {
        results: [
          { guessObjectId: 'city_01', distance: 100, points: 20 },
          { guessObjectId: 'city_02', distance: 40, points: 55 },
          { guessObjectId: 'city_03', distance: 10, points: 90 },
        ],
      },
      player_010: {
        results: [
          { guessObjectId: 'city_01', distance: 80, points: 35 },
          { guessObjectId: 'city_02', distance: 20, points: 75 },
          { guessObjectId: 'city_03', distance: 5, points: 98 },
        ],
      },
    },
  },

  {
    id: 'game_012',
    mode: SessionMode.MULTI,
    createdAt: '2025-02-10T18:05:00.000Z',
    gameConfig: {
      categories: ['cities'] as any,
      timer: 45,
      nbOfObjects: 3,
    },
    players: [
      { username: 'Bob', isGuest: true },
      { username: 'Charlie', isGuest: false, id: 'player_010' },
    ],
    guessObjectsIds: ['city_01', 'city_02', 'city_03'],
    results: {
      guest_Bob: {
        results: [
          { guessObjectId: 'city_01', distance: 100, points: 20 },
          { guessObjectId: 'city_02', distance: 40, points: 55 },
          { guessObjectId: 'city_03', distance: 10, points: 90 },
        ],
      },
      player_010: {
        results: [
          { guessObjectId: 'city_01', distance: 80, points: 35 },
          { guessObjectId: 'city_02', distance: 20, points: 75 },
          { guessObjectId: 'city_03', distance: 5, points: 98 },
        ],
      },
    },
  },
];
