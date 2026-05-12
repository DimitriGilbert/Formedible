import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

type SliderProps = Omit<ComponentProps<'input'>, 'type' | 'value' | 'onChange'> & {
  readonly value: number;
  readonly onValueChange?: (value: number) => void;
};

function Slider({ className, value, onValueChange, ...props }: SliderProps) {
  return (
    <input
      data-slot="slider"
      type="range"
      value={value}
      className={cn('w-full accent-primary disabled:cursor-not-allowed disabled:opacity-50', className)}
      onChange={(event) => onValueChange?.(Number(event.target.value))}
      {...props}
    />
  );
}

export { Slider };
