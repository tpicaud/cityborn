import '../../../scripts/test-rendering/dom';
import assert from 'node:assert/strict';
import { describe, it, type TestContext } from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '../tamagui.config';
import { CardRow } from './CardRow';

type RowRender = {
  row: HTMLElement;
  previous: HTMLButtonElement;
  next: HTMLButtonElement;
  lastCard: HTMLButtonElement;
};
const viewportWidth: number = 320;
const contentWidth: number = 4000;
async function renderRow(context: TestContext): Promise<RowRender> {
  context.mock.method(
    HTMLElement.prototype,
    'getBoundingClientRect',
    function (this: HTMLElement): DOMRect {
      const index: string | null = this.getAttribute('data-card-index');
      if (index !== null) {
        const row: HTMLElement | null = this.closest('[role="region"]');
        return new DOMRect(
          Number(index) * 160 - (row?.scrollLeft ?? 0),
          0,
          144,
          200,
        );
      }
      return new DOMRect(
        0,
        0,
        this.parentElement?.getAttribute('role') === 'region'
          ? contentWidth
          : viewportWidth,
        200,
      );
    },
  );
  const container: HTMLElement = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);
  context.after(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
  const cards: { id: string; index: number }[] = Array.from(
    { length: 25 },
    (_, index) => ({
      id: `pack-${index}`,
      index,
    }),
  );
  await act(async () => {
    root.render(
      <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
        <CardRow title="Tous les packs">
          {cards.map(({ id, index }) => (
            <button key={id} type="button" data-card-index={index}>
              Pack {index + 1}
            </button>
          ))}
        </CardRow>
      </TamaguiProvider>,
    );
  });
  const row: Element | null = container.querySelector('[role="region"]');
  const previous: Element | null = container.querySelector(
    '[aria-label="Précédent dans Tous les packs"]',
  );
  const next: Element | null = container.querySelector(
    '[aria-label="Suivant dans Tous les packs"]',
  );
  const lastCard: Element | null = container.querySelector(
    '[data-card-index="24"]',
  );
  assert.ok(row instanceof HTMLElement);
  assert.ok(previous instanceof HTMLButtonElement);
  assert.ok(next instanceof HTMLButtonElement);
  assert.ok(lastCard instanceof HTMLButtonElement);
  return { row, previous, next, lastCard };
}
function pressKey({
  row,
  key,
}: {
  row: HTMLElement;
  key: string;
}): KeyboardEvent {
  const event: KeyboardEvent = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
  });
  row.dispatchEvent(event);
  return event;
}
async function interact(action: () => void): Promise<void> {
  await act(async () => {
    action();
    await setTimeout(5);
  });
}
describe('CardRow', () => {
  it('reaches the twenty-fifth card with the mouse controls and clamps both ends', async (context: TestContext) => {
    const { row, previous, next, lastCard }: RowRender =
      await renderRow(context);

    await interact(() => {
      previous.click();
    });
    assert.equal(row.scrollLeft, 0);
    await interact(() => {
      Array.from({ length: 25 }).forEach(() => {
        next.click();
      });
    });

    assert.equal(row.querySelectorAll('[data-card-index]').length, 25);
    assert.equal(row.scrollLeft, contentWidth - viewportWidth);
    assert.ok(lastCard.getBoundingClientRect().x >= 0);
    assert.ok(lastCard.getBoundingClientRect().right <= viewportWidth);
    await interact(() => {
      Array.from({ length: 25 }).forEach(() => {
        previous.click();
      });
    });
    assert.equal(row.scrollLeft, 0);
  });
  it('handles arrow and boundary keys on the focusable row and keeps the last card reachable', async (context: TestContext) => {
    const { row, lastCard }: RowRender = await renderRow(context);
    row.focus();
    assert.equal(document.activeElement, row);

    await interact(() => {
      pressKey({ row, key: 'ArrowLeft' });
    });
    assert.equal(row.scrollLeft, 0);
    await interact(() => {
      pressKey({ row, key: 'ArrowRight' });
    });
    assert.ok(row.scrollLeft > 0);
    await interact(() => {
      const event: KeyboardEvent = pressKey({ row, key: 'End' });
      assert.equal(event.defaultPrevented, true);
    });
    assert.equal(row.scrollLeft, contentWidth - viewportWidth);
    assert.ok(lastCard.getBoundingClientRect().right <= viewportWidth);
    await interact(() => {
      pressKey({ row, key: 'ArrowRight' });
    });
    assert.equal(row.scrollLeft, contentWidth - viewportWidth);
    await interact(() => {
      pressKey({ row, key: 'Home' });
    });
    assert.equal(row.scrollLeft, 0);
  });
  it('continues from the position reached by a touch or trackpad scroll', async (context: TestContext) => {
    const { row, next }: RowRender = await renderRow(context);

    await interact(() => {
      row.scrollLeft = 1500;
      row.dispatchEvent(new Event('scroll'));
      next.click();
    });

    assert.equal(row.scrollLeft, 1500 + viewportWidth * 0.8);
  });
});
