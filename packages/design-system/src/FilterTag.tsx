import type { ReactNode } from 'react';
import { styled } from 'tamagui';
import { Caption } from './Caption';
import { PressableFrame } from './PressableFrame';
import { verticalGradient } from './palette';

type FilterTagProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: ReactNode;
};

const FilterTagFrame = styled(PressableFrame, {
  flexDirection: 'row',
  items: 'center',
  justify: 'center',
  gap: '2',
  px: '3.5',
  py: '2',
  rounded: '8',
  borderWidth: '1',
  opacity: 'press:0.8',
  variants: {
    selected: {
      true: {
        borderColor: 'transparent',
        backgroundImage: verticalGradient('cta-orange'),
        boxShadow: 'tag-selected',
      },
      false: {
        borderColor: 'tag-border',
        backgroundColor: 'tag-fill',
      },
    },
  } as const,
});

const FilterTagLabel = styled(Caption, {
  color: 'white',
  select: 'none',
});

export function FilterTag({ label, selected, onPress, icon }: FilterTagProps) {
  return (
    <FilterTagFrame
      selected={selected}
      aria-pressed={selected}
      onPress={onPress}
    >
      <FilterTagLabel>{label}</FilterTagLabel>
      {icon}
    </FilterTagFrame>
  );
}
