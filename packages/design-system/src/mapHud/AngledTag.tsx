import { styled, Text, View } from 'tamagui';

type AngledTagProps = {
  label: string;
  angleInDegrees: number;
};

const TagFrame = styled(View, {
  px: '3 md:5',
  py: '0.5 md:1',
  rounded: 'full',
  bg: 'mid-blue',
});

const TagLabel = styled(Text, {
  fontFamily: 'body',
  fontSize: '4 md:7',
  lineHeight: '4 md:7',
  fontWeight: '500',
  color: 'secondary-cyan',
  select: 'none',
});

export function AngledTag({ label, angleInDegrees }: AngledTagProps) {
  return (
    <TagFrame rotate={`${angleInDegrees}deg`}>
      <TagLabel>{label}</TagLabel>
    </TagFrame>
  );
}
