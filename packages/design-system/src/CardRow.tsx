import {
  Children,
  type ReactNode,
  type RefObject,
  useRef,
  useState,
} from 'react';
import {
  type GetRef,
  ScrollView,
  type ScrollViewProps,
  styled,
  Text,
  View,
} from 'tamagui';
import { Chevron } from './Chevron';
import { PressableFrame } from './PressableFrame';

type CardRowProps = {
  title: string;
  children: ReactNode;
};

type RowExtent = {
  offset: number;
  viewport: number;
  content: number;
};

type ScrollDirection = -1 | 1;

const pageRatio: number = 0.8;

const RowHeader = styled(View, {
  flexDirection: 'row',
  items: 'center',
  gap: '2 md:4',
});

const RowTitle = styled(Text, {
  role: 'heading',
  flex: 1,
  fontFamily: 'heading',
  fontSize: '6 md:11',
  lineHeight: '7 md:12',
  fontWeight: '700',
  color: 'white',
});

const ArrowButton = styled(PressableFrame, {
  items: 'center',
  justify: 'center',
  w: '9 md:14',
  h: '9 md:14',
  rounded: 'full',
  borderWidth: '1 md:2',
  borderColor: 'tag-border',
  backgroundColor: 'tag-fill',
  opacity: 'press:0.8',
  variants: {
    dimmed: {
      true: { opacity: 0.4 },
    },
  } as const,
});

const RowCards = styled(View, {
  flexDirection: 'row',
  items: 'flex-start',
  gap: '2.5 md:6',
  px: '4 md:10',
  pt: '1',
  pb: '3 md:5',
});

const CardCell = styled(View, {
  w: '36 md:80',
  shrink: 0,
});

function clamp({ value, max }: { value: number; max: number }): number {
  return Math.min(Math.max(value, 0), max);
}

export function CardRow({ title, children }: CardRowProps) {
  const scrollViewRef: RefObject<GetRef<typeof ScrollView> | null> =
    useRef<GetRef<typeof ScrollView>>(null);
  const extentRef: RefObject<RowExtent> = useRef<RowExtent>({
    offset: 0,
    viewport: 0,
    content: 0,
  });
  const [canScrollBack, setCanScrollBack] = useState<boolean>(false);
  const [canScrollForward, setCanScrollForward] = useState<boolean>(false);

  const maxOffset = (): number =>
    Math.max(0, extentRef.current.content - extentRef.current.viewport);

  const updateExtent = (change: Partial<RowExtent>): void => {
    extentRef.current = { ...extentRef.current, ...change };
    const max: number = maxOffset();
    setCanScrollBack(extentRef.current.offset > 1);
    setCanScrollForward(extentRef.current.offset < max - 1);
  };

  const scrollTo = (offset: number): void => {
    const x: number = clamp({ value: offset, max: maxOffset() });
    updateExtent({ offset: x });
    scrollViewRef.current?.scrollTo({ x, animated: true });
  };

  const scrollByPage = (direction: ScrollDirection): void =>
    scrollTo(
      extentRef.current.offset +
        direction * extentRef.current.viewport * pageRatio,
    );

  const measureViewport: ScrollViewProps['onLayout'] = ({
    nativeEvent: { layout },
  }) => updateExtent({ viewport: layout.width });

  const measureContent: ScrollViewProps['onContentSizeChange'] = (
    width: number,
  ) => updateExtent({ content: width });

  const followScroll: ScrollViewProps['onScroll'] = ({
    nativeEvent: { contentOffset },
  }) => updateExtent({ offset: contentOffset.x });

  const scrollFromKeyboard: ScrollViewProps['onKeyDown'] = (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      scrollByPage(event.key === 'ArrowLeft' ? -1 : 1);
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      scrollTo(event.key === 'Home' ? 0 : maxOffset());
    }
  };

  return (
    <View gap="2 md:5">
      <RowHeader>
        <RowTitle>{title}</RowTitle>
        <View display="none hoverable:flex" flexDirection="row" gap="2">
          <ArrowButton
            aria-label={`Précédent dans ${title}`}
            aria-disabled={!canScrollBack}
            dimmed={!canScrollBack}
            onPress={() => scrollByPage(-1)}
          >
            <Chevron rotate="-135deg" mr="0" ml="0.5 md:1" />
          </ArrowButton>
          <ArrowButton
            aria-label={`Suivant dans ${title}`}
            aria-disabled={!canScrollForward}
            dimmed={!canScrollForward}
            onPress={() => scrollByPage(1)}
          >
            <Chevron />
          </ArrowButton>
        </View>
      </RowHeader>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        role="region"
        aria-label={title}
        tabIndex={0}
        mx="-4 md:-10"
        outlineColor="focus-visible:white"
        outlineStyle="focus-visible:solid"
        outlineWidth="focus-visible:0.5"
        outlineOffset="-0.5"
        style={{ flexGrow: 0, flexShrink: 0 }}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onLayout={measureViewport}
        onContentSizeChange={measureContent}
        onScroll={followScroll}
        onKeyDown={scrollFromKeyboard}
      >
        <RowCards>
          {Children.map(children, (card: ReactNode) => (
            <CardCell>{card}</CardCell>
          ))}
        </RowCards>
      </ScrollView>
    </View>
  );
}
