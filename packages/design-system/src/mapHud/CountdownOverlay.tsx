import { styled, Text, View } from 'tamagui';

type CountdownOverlayProps = {
  count: number;
};

const CountdownScrim = styled(View, {
  position: 'absolute',
  t: '0',
  r: '0',
  b: '0',
  l: '0',
  items: 'center',
  justify: 'center',
  bg: 'scrim',
});

const CountdownValue = styled(Text, {
  role: 'timer',
  fontFamily: 'heading',
  fontSize: '14',
  lineHeight: '14',
  fontWeight: '700',
  color: 'white',
  textShadow: 'screen-title',
  select: 'none',
});

export function CountdownOverlay({ count }: CountdownOverlayProps) {
  return (
    <CountdownScrim>
      <CountdownValue>{count}</CountdownValue>
    </CountdownScrim>
  );
}
