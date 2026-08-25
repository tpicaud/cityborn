import * as Ariakit from '@ariakit/react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DialogProps
  extends Omit<React.ComponentProps<typeof Ariakit.Dialog>, 'children'> {
  store: Ariakit.DialogStore;
  children: ReactNode;
}

export function Dialog({ store, children, className, ...props }: DialogProps) {
  return (
    <Ariakit.Dialog
      store={store}
      portal={false}
      backdrop={<div className="fixed bg-black/40 backdrop-blur-sm z-40" />}
      className={cn(
        'fixed z-60 flex flex-col items-center justify-center w-md top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background rounded-xl focus:outline-none',
        className,
      )}
      {...props}
    >
      <div className="h-full w-full p-6">{children}</div>
    </Ariakit.Dialog>
  );
}
