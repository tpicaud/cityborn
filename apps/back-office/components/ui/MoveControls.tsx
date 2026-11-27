import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './Button';

export function MoveControls({
  itemLabel,
  isFirst,
  isLast,
  disabled,
  onMoveUp,
  onMoveDown,
}: {
  itemLabel: string;
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        disabled={disabled || isFirst}
        onClick={onMoveUp}
        aria-label={`Monter ${itemLabel}`}
      >
        <ChevronUp size={18} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        disabled={disabled || isLast}
        onClick={onMoveDown}
        aria-label={`Descendre ${itemLabel}`}
      >
        <ChevronDown size={18} />
      </Button>
    </>
  );
}
