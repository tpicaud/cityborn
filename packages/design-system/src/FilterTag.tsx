import type { ReactNode } from 'react';
import { styled, View } from 'tamagui';
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
  gap: '2 md:4',
  px: '3.5 md:7',
  py: '2 md:4',
  rounded: '8 md:11',
  borderWidth: '1 md:2',
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
  fontSize: '2 md:6',
  lineHeight: '2 md:6',
  color: 'white',
  select: 'none',
});

const FilterTagIcon = styled(View, {
  w: '4 md:8',
  h: '4 md:8',
  pointerEvents: 'none',
});

export function FilterTag({ label, selected, onPress, icon }: FilterTagProps) {
  return (
    <FilterTagFrame
      selected={selected}
      aria-pressed={selected}
      onPress={onPress}
    >
      <FilterTagLabel>{label}</FilterTagLabel>
      {icon !== undefined && <FilterTagIcon aria-hidden>{icon}</FilterTagIcon>}
    </FilterTagFrame>
  );
}
