'use client';

import { Button } from '@formedible/ui/components/button';
import { Popover, PopoverContent, PopoverTrigger } from '@formedible/ui/components/popover';
import { cn } from '@formedible/ui/lib/utils';

import { AiPickerPanel } from '@/components/ai-picker/ai-picker-panel';
import type { AiPickerPanelProps } from '@/components/ai-picker/ai-picker-panel';
import { defaultProviderConfigs } from '@/lib/default-picker-schema';

export type AiPickerPopoverProps = AiPickerPanelProps;

function resolveProviderLabel(provider: string): string {
  const config = defaultProviderConfigs.find((c) => c.value === provider);
  return config?.label ?? provider;
}

export function AiPickerPopover(props: AiPickerPopoverProps) {
  const { values, className } = props;
  const label = resolveProviderLabel(values.provider);

  return (
    <Popover>
      <PopoverTrigger render={
        <Button variant="outline" className={cn('justify-start', className)}>
          {label} · {values.model}
        </Button>
      }
      />
      <PopoverContent align="start" className="w-96 p-0">
        <AiPickerPanel {...props} className="border-0 bg-transparent p-3 shadow-none" />
      </PopoverContent>
    </Popover>
  );
}
