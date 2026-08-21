'use client';

import { AiPickerPanel } from '@formedible/ui/components/formedible/ai-picker/components/ai-picker-panel';
import type { AiPickerPanelProps } from '@formedible/ui/components/formedible/ai-picker/components/ai-picker-panel';
import { Button } from '@formedible/ui/components/button';
import { Popover, PopoverContent, PopoverTrigger } from '@formedible/ui/components/popover';
import type { AiPickerProviderConfig } from '@formedible/ui/components/formedible/ai-picker/lib/ai-picker-types';
import { defaultProviderConfigs } from '@formedible/ui/components/formedible/ai-picker/lib/default-picker-schema';
import { cn } from '@formedible/ui/lib/utils';

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
