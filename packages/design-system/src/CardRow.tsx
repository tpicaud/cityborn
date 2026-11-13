import { Children, type ReactNode, type RefObject, useRef } from 'react';
import { type GetRef, ScrollView, styled, Text, View } from 'tamagui';
import { PressableFrame } from './PressableFrame';

type CardRowProps = { title: string; children: ReactNode };
const SectionTitle = styled(Text, {
  role: 'heading',
  fontFamily: 'heading',
  fontSize: '6 md:10',
  lineHeight: '8 md:12',
  fontWeight: '700',
  color: 'white',
  flex: 1,
});
const Arrow = styled(PressableFrame, {
  bg: 'transparent',
  w: '11',
  h: '11',
  items: 'center',
  justify: 'center',
});
const ArrowLabel = styled(Text, {
  fontSize: '9',
  lineHeight: '11',
  color: 'white',
});
const Cell = styled(View, { w: '36 md:64', shrink: 0 });

export function CardRow({ title, children }: CardRowProps) {
  const scrollRef: RefObject<GetRef<typeof ScrollView> | null> = useRef(null);
  const offset: RefObject<number> = useRef(0);
  const viewport: RefObject<number> = useRef(0);
  const content: RefObject<number> = useRef(0);
  const scrollTo: (position: number) => void = (position) => {
    const x: number = Math.max(
      0,
      Math.min(position, content.current - viewport.current),
    );
    offset.current = x;
    scrollRef.current?.scrollTo({ x, animated: true });
  };
  const move: (direction: number) => void = (direction) =>
    scrollTo(offset.current + direction * viewport.current * 0.8);
  return (
    <View gap="2 md:4">
      <View flexDirection="row" items="center" gap="2">
        <SectionTitle>{title}</SectionTitle>
        <View display="none web:flex" flexDirection="row">
          <Arrow
            aria-label={`Précédent dans ${title}`}
            onPress={() => move(-1)}
          >
            <ArrowLabel>‹</ArrowLabel>
          </Arrow>
          <Arrow aria-label={`Suivant dans ${title}`} onPress={() => move(1)}>
            <ArrowLabel>›</ArrowLabel>
          </Arrow>
        </View>
      </View>
      <ScrollView
        ref={scrollRef}
        horizontal
        role="region"
        aria-label={title}
        tabIndex={0}
        showsHorizontalScrollIndicator
        style={{ flexGrow: 0, flexShrink: 0 }}
        onLayout={(event) => {
          viewport.current = event.nativeEvent.layout.width;
        }}
        onContentSizeChange={(width: number) => {
          content.current = width;
        }}
        onScroll={(event) => {
          offset.current = event.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            move(event.key === 'ArrowLeft' ? -1 : 1);
            return;
          }
          if (event.key === 'Home' || event.key === 'End') {
            event.preventDefault();
            scrollTo(event.key === 'Home' ? 0 : content.current);
          }
        }}
      >
        <View flexDirection="row" gap="3 md:6" p="1" items="flex-start">
          {Children.map(children, (card: ReactNode) => (
            <Cell>{card}</Cell>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
