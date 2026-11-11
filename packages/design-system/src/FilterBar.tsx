import type { ReactNode } from 'react';
import { ScrollView, View } from 'tamagui';

type FilterBarProps = {
  label: string;
  children: ReactNode;
};

export function FilterBar({ label, children }: FilterBarProps) {
  return (
    <ScrollView
      horizontal
      grow={0}
      shrink={0}
      mx="-4 md:-10"
      showsHorizontalScrollIndicator={false}
    >
      <View
        role="group"
        aria-label={label}
        flexDirection="row"
        gap="1 md:2"
        px="4 md:10"
      >
        {children}
      </View>
    </ScrollView>
  );
}
