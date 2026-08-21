'use client';

import { AiPickerPanel } from '@/components/ai-picker/ai-picker-panel';
import type { AiPickerPanelProps } from '@/components/ai-picker/ai-picker-panel';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { AiPickerProviderConfig } from '@/lib/ai-picker-types';
import { defaultProviderConfigs } from '@/lib/default-picker-schema';
import { cn } from '@/lib/utils';

export type AiPickerPopoverProps = AiPickerPanelProps;

function resolveProviderLabel(provider: string, providerConfigs: readonly AiPickerProviderConfig[]): string {
  const config = providerConfigs.find((c) => c.value === provider);
  return config?.label ?? provider;
}

export function AiPickerPopover(props: AiPickerPopoverProps) {
  const { values, providerConfigs, className } = props;
  const label = resolveProviderLabel(values.provider, providerConfigs ?? defaultProviderConfigs);

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
