import type { ReactNode } from 'react';
import { styled, View } from 'tamagui';
import { BodyText } from './BodyText';

const ActionPromptFrame = styled(View, {
  gap: '3',
  self: 'center',
  w: '100%',
  maxW: 'md:96',
});

type ActionPromptProps = {
  prompt: string;
  children: ReactNode;
};

export function ActionPrompt({ prompt, children }: ActionPromptProps) {
  return (
    <ActionPromptFrame>
      <BodyText emphasized>{prompt}</BodyText>
      {children}
    </ActionPromptFrame>
  );
}
