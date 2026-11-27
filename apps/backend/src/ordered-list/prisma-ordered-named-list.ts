import { Prisma } from '@prisma/client';
import type { PrismaTransactionHost } from '../prisma/prisma-cls.module';
import { NameAlreadyExistsError } from './ordered-named-list';

type PositionedModel<Where> = {
  aggregate(args: {
    where: Where;
    _max: { position: true };
  }): Promise<{ _max: { position: number | null } }>;
  update(args: {
    where: { id: string };
    data: { position: number };
  }): Promise<unknown>;
};

export class PrismaOrderedNamedList<Where> {
  constructor(
    private readonly list: {
      txHost: PrismaTransactionHost;
      table: Prisma.ModelName;
      model: (tx: PrismaTransactionHost['tx']) => PositionedModel<Where>;
    },
  ) {}

  async lockOrder(): Promise<void> {
    await this.list.txHost.tx
      .$executeRaw`LOCK TABLE ${Prisma.raw(`"${this.list.table}"`)} IN SHARE ROW EXCLUSIVE MODE`;
  }

  async append<Row>({
    where,
    create,
  }: {
    where: Where;
    create: (position: number) => Promise<Row>;
  }): Promise<Row> {
    return this.save(async () => {
      const lastPosition: number | null = (
        await this.model().aggregate({ where, _max: { position: true } })
      )._max.position;
      return create((lastPosition ?? -1) + 1);
    });
  }

  async reorder(ids: string[]): Promise<void> {
    await Promise.all(
      ids.map((id, position) =>
        this.model().update({ where: { id }, data: { position } }),
      ),
    );
  }

  async save<Row>(write: () => Promise<Row>): Promise<Row> {
    try {
      return await write();
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new NameAlreadyExistsError();
      throw error;
    }
  }

  private model(): PositionedModel<Where> {
    return this.list.model(this.list.txHost.tx);
  }
}
