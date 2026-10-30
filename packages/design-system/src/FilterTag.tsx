import type { ReactNode } from 'react';
import { styled, Text, View } from 'tamagui';
import { verticalGradient } from './palette';

type FilterTagProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: ReactNode;
};

const FilterTagFrame = styled(View, {
  role: 'button',
  render: <button type="button" />,
  tabIndex: 0,
  flexDirection: 'row',
  items: 'center',
  justify: 'center',
  gap: '2',
  px: '3.5',
  py: '2',
  rounded: '8',
  borderWidth: '1',
  cursor: 'web:pointer',
  opacity: 'press:0.8',
  outlineColor: 'focus-visible:white',
  outlineStyle: 'focus-visible:solid',
  outlineWidth: 'focus-visible:2px',
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

const FilterTagLabel = styled(Text, {
  fontFamily: 'body',
  fontSize: '2',
  lineHeight: '2',
  fontWeight: '500',
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
