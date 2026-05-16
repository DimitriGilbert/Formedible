import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import type { ComponentProps } from 'react';

import { cn } from '@formedible/ui/lib/utils';

type PopoverProps = ComponentProps<typeof PopoverPrimitive.Root>;

type PopoverTriggerProps = ComponentProps<typeof PopoverPrimitive.Trigger>;

type PopoverContentProps = ComponentProps<typeof PopoverPrimitive.Popup> & {
  readonly align?: ComponentProps<typeof PopoverPrimitive.Positioner>['align'];
  readonly side?: ComponentProps<typeof PopoverPrimitive.Positioner>['side'];
  readonly sideOffset?: ComponentProps<typeof PopoverPrimitive.Positioner>['sideOffset'];
};

function Popover(props: PopoverProps) {
  return <PopoverPrimitive.Root {...props} />;
}

function PopoverTrigger(props: PopoverTriggerProps) {
  return <PopoverPrimitive.Trigger {...props} />;
}

function PopoverContent({ className, align = 'start', side = 'bottom', sideOffset = 4, ...props }: PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner align={align} side={side} sideOffset={sideOffset} className="z-50 outline-none">
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            'bg-popover text-popover-foreground data-[ending-style]:animate-out data-[ending-style]:fade-out-0 data-[starting-style]:animate-in data-[starting-style]:fade-in-0 data-[ending-style]:zoom-out-95 data-[starting-style]:zoom-in-95 min-w-[var(--anchor-width)] rounded-md border shadow-md outline-none',
            className,
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverContent, PopoverTrigger };
