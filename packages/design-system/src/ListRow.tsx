import { styled, Text, View } from 'tamagui';

type ListRowProps = {
  label: string;
  onPress: () => void;
};

const ListRowFrame = styled(View, {
  role: 'button',
  render: <button type="button" />,
  tabIndex: 0,
  self: 'stretch',
  flexDirection: 'row',
  items: 'center',
  justify: 'space-between',
  gap: '4',
  px: '4',
  py: '3',
  rounded: 'lg',
  borderWidth: '0',
  backgroundColor: 'row-fill press:row-fill-press',
  cursor: 'web:pointer',
  outlineColor: 'focus-visible:white',
  outlineStyle: 'focus-visible:solid',
  outlineWidth: 'focus-visible:2px',
});

const ListRowLabel = styled(Text, {
  shrink: 1,
  fontFamily: 'body',
  fontSize: '4',
  lineHeight: '4',
  fontWeight: '500',
  color: 'white',
  select: 'none',
});

const Chevron = styled(View, {
  w: '1.5',
  h: '1.5',
  mr: '0.5',
  borderTopWidth: 1.5,
  borderRightWidth: 1.5,
  borderColor: 'white',
  rotate: '45deg',
});

export function ListRow({ label, onPress }: ListRowProps) {
  return (
    <ListRowFrame onPress={onPress}>
      <ListRowLabel>{label}</ListRowLabel>
      <Chevron />
    </ListRowFrame>
  );
}
