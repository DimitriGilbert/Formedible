import { Heart, Star, ThumbsUp } from 'lucide-react';
import { useState } from 'react';

import { FieldWrapper } from '@formedible/ui/components/formedible/fields/field-wrapper';
import { getNumber } from '@formedible/ui/components/formedible/fields/advanced-field-utils';
import { Button } from '@formedible/ui/components/button';
import type { FormedibleFieldRenderProps, FormedibleFormValues } from '@formedible/ui/components/formedible/lib/types';
import { cn } from '@formedible/ui/lib/utils';

const icons = { star: Star, heart: Heart, thumbs: ThumbsUp } as const;
const sizes = { sm: 'size-4', md: 'size-6', lg: 'size-8' } as const;
const halfStepEpsilon = 1e-6;

function isRatingChecked(value: number, rating: number): boolean {
  return Math.abs(value - rating) < halfStepEpsilon;
}

export function RatingField<TFormValues extends FormedibleFormValues>({ fieldConfig, field }: FormedibleFieldRenderProps<TFormValues>) {
  const config = fieldConfig.ratingConfig;
  const max = config?.max ?? 5;
  const icon = config?.icon ?? 'star';
  const Icon = icons[icon];
  const value = getNumber(field.value, 0);
  const [hoverValue, setHoverValue] = useState<number | undefined>();
  const activeValue = hoverValue ?? value;

  return (
    <FieldWrapper fieldConfig={fieldConfig} field={field}>
      <div className="space-y-2">
        {config?.showValue && <div className="text-xs text-muted-foreground">({value}/{max})</div>}
        <div className="flex items-center gap-1" role="radiogroup" aria-label={typeof fieldConfig.label === 'string' ? fieldConfig.label : field.name}>
          {Array.from({ length: max }, (_, index) => {
            const rating = index + 1;
            const halfRating = index + 0.5;
            const isFull = activeValue >= rating;
            const isHalf = !isFull && config?.allowHalf === true && activeValue >= halfRating;
            const iconSize = sizes[config?.size ?? 'md'];

            return (
              <span key={rating} className="relative inline-flex">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  role="radio"
                  aria-checked={isRatingChecked(value, rating)}
                  aria-label={`Rate ${rating}`}
                  disabled={fieldConfig.disabled}
                  className="transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
                  onBlur={field.onBlur}
                  onClick={() => field.onChange(rating)}
                  onMouseEnter={() => setHoverValue(rating)}
                  onMouseLeave={() => setHoverValue(undefined)}
                >
                  {isFull ? (
                    <Icon className={cn(iconSize, activeClass(icon))} />
                  ) : isHalf ? (
                    <span className="relative inline-flex" data-slot="rating-half">
                      <Icon className={cn(iconSize, 'text-muted-foreground')} />
                      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
                        <Icon className={cn(iconSize, activeClass(icon))} />
                      </span>
                    </span>
                  ) : (
                    <Icon className={cn(iconSize, 'text-muted-foreground')} />
                  )}
                </Button>
                {config?.allowHalf && (
                  <Button
                    type="button"
                    variant="ghost"
                    role="radio"
                    aria-checked={isRatingChecked(value, halfRating)}
                    aria-label={`Rate ${halfRating}`}
                    disabled={fieldConfig.disabled}
                    className="absolute inset-y-0 left-0 h-auto w-1/2 p-0 disabled:cursor-not-allowed"
                    onClick={() => field.onChange(halfRating)}
                    onMouseEnter={() => setHoverValue(halfRating)}
                    onMouseLeave={() => setHoverValue(undefined)}
                  />
                )}
              </span>
            );
          })}
          {value > 0 && (
            <Button type="button" variant="ghost" disabled={fieldConfig.disabled} className="ml-2 h-auto text-xs text-muted-foreground hover:text-foreground" onClick={() => field.onChange(0)}>
              Clear
            </Button>
          )}
        </div>
      </div>
    </FieldWrapper>
  );
}

function activeClass(icon: 'star' | 'heart' | 'thumbs'): string {
  if (icon === 'heart') {
    return 'fill-red-500 text-red-500';
  }

  if (icon === 'thumbs') {
    return 'fill-blue-500 text-blue-500';
  }

  return 'fill-yellow-400 text-yellow-400';
}
