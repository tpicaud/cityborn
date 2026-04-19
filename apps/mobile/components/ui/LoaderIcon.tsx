import { LoaderCircle } from 'lucide-react-native';
import { styled } from 'nativewind';
import { View } from 'react-native';
import { cn } from '@/lib/utils';

const AnimatedView = styled(View);

type LoaderIconProps = React.ComponentProps<typeof LoaderCircle>;

export default function LoaderIcon(props: LoaderIconProps) {
  return (
    <AnimatedView className={cn('animate-spin')}>
      <LoaderCircle {...props} />
    </AnimatedView>
  );
}
