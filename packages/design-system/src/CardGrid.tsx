import { Children, type ReactNode } from 'react';
import { ScrollView, styled, View } from 'tamagui';

type CardGridProps = {
  children: ReactNode;
};

const GridRows = styled(View, {
  flexDirection: 'row',
  flexWrap: 'wrap',
  px: '2.5 md:7',
  pb: '4 md:6',
});

const GridCell = styled(View, {
  w: '50% md:33.333%',
  px: '1.5 md:3',
  pb: '3 md:6',
});

export function CardGrid({ children }: CardGridProps) {
  return (
    <ScrollView
      flex={1}
      minH="0"
      mx="-4 md:-10"
      showsVerticalScrollIndicator={false}
    >
      <GridRows>
        {Children.map(children, (card: ReactNode) => (
          <GridCell>{card}</GridCell>
        ))}
      </GridRows>
    </ScrollView>
  );
}
