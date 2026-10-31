import { styled, View } from 'tamagui';
import { Caption } from './Caption';

type BadgeProps = {
  label: string;
};

const BadgeFrame = styled(View, {
  self: 'flex-start',
  px: '2',
  py: '1',
  rounded: 'full',
  backgroundColor: 'badge-fill',
});

const BadgeLabel = styled(Caption, {
  color: 'badge-text',
  select: 'none',
});

export function Badge({ label }: BadgeProps) {
  return (
    <BadgeFrame>
      <BadgeLabel>{label}</BadgeLabel>
    </BadgeFrame>
  );
}
