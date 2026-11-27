export function swapWithNeighbour<Item>({
  items,
  index,
  direction,
}: {
  items: Item[];
  index: number;
  direction: 'UP' | 'DOWN';
}): Item[] | null {
  const neighbourIndex: number = direction === 'UP' ? index - 1 : index + 1;
  const item: Item | undefined = items[index];
  const neighbour: Item | undefined = items[neighbourIndex];
  if (item === undefined || neighbour === undefined) return null;
  return items.with(index, neighbour).with(neighbourIndex, item);
}
