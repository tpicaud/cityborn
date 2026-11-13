import { styled, Text } from 'tamagui';
import { Chevron } from './Chevron';
import { PressableFrame } from './PressableFrame';

type ListRowProps = {
  label: string;
  onPress: () => void;
};

const ListRowFrame = styled(PressableFrame, {
  self: 'stretch',
  flexDirection: 'row',
  items: 'center',
  justify: 'space-between',
  gap: '4',
  px: '4 md:5',
  py: '3 md:6',
  rounded: 'lg md:6',
  backgroundColor: 'row-fill press:row-fill-press',
});

const ListRowLabel = styled(Text, {
  shrink: 1,
  fontFamily: 'body',
  fontSize: '4 md:8',
  lineHeight: '4 md:8',
  fontWeight: '500',
  color: 'white',
  text: 'left',
  select: 'none',
});

export function ListRow({ label, onPress }: ListRowProps) {
  return (
    <ListRowFrame onPress={onPress}>
      <ListRowLabel>{label}</ListRowLabel>
      <Chevron />
    </ListRowFrame>
  );
}
