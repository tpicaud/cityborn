import { styled, Text, View } from 'tamagui';

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

const BadgeLabel = styled(Text, {
  fontFamily: 'body',
  fontSize: '2',
  lineHeight: '2',
  fontWeight: '500',
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
