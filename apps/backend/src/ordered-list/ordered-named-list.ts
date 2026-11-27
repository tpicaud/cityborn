import type { ErrorCode } from '@cityborn/api';
import { ConflictException, type HttpException } from '@nestjs/common';

type MoveDirection = 'UP' | 'DOWN';

export class NameAlreadyExistsError extends Error {}

export interface OrderedNamedListRepository<Item extends { id: string }> {
  lockOrder(): Promise<void>;
  findAll(): Promise<Item[]>;
  reorder(ids: Item['id'][]): Promise<void>;
}

export function swapWithNeighbour<Item>({
  items,
  index,
  direction,
}: {
  items: Item[];
  index: number;
  direction: MoveDirection;
}): Item[] | null {
  const neighbourIndex: number = direction === 'UP' ? index - 1 : index + 1;
  const item: Item | undefined = items[index];
  const neighbour: Item | undefined = items[neighbourIndex];
  if (item === undefined || neighbour === undefined) return null;
  return items.with(index, neighbour).with(neighbourIndex, item);
}

export class OrderedNamedList<Item extends { id: string }> {
  constructor(
    private readonly list: {
      repository: OrderedNamedListRepository<Item>;
      notFound: () => HttpException;
      nameConflict: { code: ErrorCode; message: string };
      belongsToSameList?: ({
        item,
        movedItem,
      }: {
        item: Item;
        movedItem: Item;
      }) => boolean;
    },
  ) {}

  async append<Created>(create: () => Promise<Created>): Promise<Created> {
    await this.list.repository.lockOrder();
    return this.save(create);
  }

  async move({
    id,
    direction,
  }: {
    id: Item['id'];
    direction: MoveDirection;
  }): Promise<Item[]> {
    await this.list.repository.lockOrder();
    const items: Item[] = await this.list.repository.findAll();
    const movedItem: Item | undefined = items.find((item) => item.id === id);
    if (!movedItem) throw this.list.notFound();
    const isInMovedList: (item: Item) => boolean = (item) =>
      this.list.belongsToSameList?.({ item, movedItem }) ?? true;
    const movedList: Item[] = items.filter(isInMovedList);
    const reorderedList: Item[] | null = swapWithNeighbour({
      items: movedList,
      index: movedList.indexOf(movedItem),
      direction,
    });
    if (!reorderedList) return items;
    await this.list.repository.reorder(reorderedList.map((item) => item.id));
    return this.list.repository.findAll();
  }

  async save<Saved>(write: () => Promise<Saved>): Promise<Saved> {
    try {
      return await write();
    } catch (error: unknown) {
      if (error instanceof NameAlreadyExistsError)
        throw new ConflictException(this.list.nameConflict);
      throw error;
    }
  }
}
