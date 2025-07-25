'use client';
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Star, Heart, ThumbsUp } from 'lucide-react';
import type { BaseFieldProps } from '@/lib/formedible/types';

export interface RatingFieldSpecificProps extends BaseFieldProps {
  ratingConfig?: {
    max?: number;
    allowHalf?: boolean;
    icon?: 'star' | 'heart' | 'thumbs';
    size?: 'sm' | 'md' | 'lg';
    showValue?: boolean;
  };
}

const ICON_COMPONENTS = {
  star: Star,
  heart: Heart,
  thumbs: ThumbsUp,
};

const SIZE_CLASSES = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export const RatingField: React.FC<RatingFieldSpecificProps> = ({
  fieldApi,
  label,
  description,
  ratingConfig = {},
  labelClassName,
  wrapperClassName,
}) => {
  const {
    max = 5,
    allowHalf = false,
    icon = 'star',
    size = 'md',
    showValue = false,
  } = ratingConfig;

  const { state, handleChange, handleBlur } = fieldApi;
  const value = (state.value as number) || 0;
  
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const IconComponent = ICON_COMPONENTS[icon];
  const iconSizeClass = SIZE_CLASSES[size];

  const handleRatingClick = (rating: number) => {
    handleChange(rating);
    handleBlur();
  };

  const handleMouseEnter = (rating: number) => {
    if (!fieldApi.form.state.isSubmitting) {
      setHoverValue(rating);
    }
  };

  const handleMouseLeave = () => {
    setHoverValue(null);
  };

  const getRatingValue = (index: number, isHalf: boolean = false): number => {
    return isHalf ? index + 0.5 : index + 1;
  };

  const shouldShowFilled = (index: number, isHalf: boolean = false): boolean => {
    const ratingValue = getRatingValue(index, isHalf);
    const currentValue = hoverValue !== null ? hoverValue : value;
    
    if (isHalf) {
      return currentValue >= ratingValue;
    } else {
      return currentValue >= ratingValue || (allowHalf && currentValue >= ratingValue - 0.5);
    }
  };

  const shouldShowHalfFilled = (index: number): boolean => {
    if (!allowHalf) return false;
    
    const currentValue = hoverValue !== null ? hoverValue : value;
    const fullRating = index + 1;
    const halfRating = index + 0.5;
    
    return currentValue >= halfRating && currentValue < fullRating;
  };

  const getDisplayValue = (): string => {
    if (!showValue) return '';
    
    const displayRating = hoverValue !== null ? hoverValue : value;
    return allowHalf && displayRating % 1 !== 0 
      ? displayRating.toFixed(1) 
      : displayRating.toString();
  };

  return (
    <div className={cn("space-y-2", wrapperClassName)}>
      {label && (
        <Label className={cn("text-sm font-medium", labelClassName)}>
          {label}
          {showValue && (
            <span className="ml-2 text-sm text-muted-foreground">
              ({getDisplayValue()}/{max})
            </span>
          )}
        </Label>
      )}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      <div className="flex items-center gap-1">
        {Array.from({ length: max }, (_, index) => (
          <div key={index} className="relative">
            {/* Full star/icon button */}
            <button
              type="button"
              className={cn(
                "relative transition-all duration-150 hover:scale-110",
                fieldApi.form.state.isSubmitting 
                  ? "cursor-not-allowed opacity-50" 
                  : "cursor-pointer"
              )}
              onClick={() => handleRatingClick(getRatingValue(index, false))}
              onMouseEnter={() => handleMouseEnter(getRatingValue(index, false))}
              onMouseLeave={handleMouseLeave}
              disabled={fieldApi.form.state.isSubmitting}
              title={`Rate ${getRatingValue(index, false)} ${icon}${getRatingValue(index, false) !== 1 ? 's' : ''}`}
            >
              <IconComponent
                className={cn(
                  iconSizeClass,
                  "transition-colors duration-150",
                  shouldShowFilled(index, false)
                    ? icon === 'star' 
                      ? "fill-yellow-400 text-yellow-400" 
                      : icon === 'heart'
                      ? "fill-red-500 text-red-500"
                      : "fill-blue-500 text-blue-500"
                    : "text-muted-foreground hover:text-muted-foreground/80"
                )}
              />
              
              {/* Half-fill overlay for half ratings */}
              {allowHalf && shouldShowHalfFilled(index) && (
                <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                  <IconComponent
                    className={cn(
                      iconSizeClass,
                      icon === 'star' 
                        ? "fill-yellow-400 text-yellow-400" 
                        : icon === 'heart'
                        ? "fill-red-500 text-red-500"
                        : "fill-blue-500 text-blue-500"
                    )}
                  />
                </div>
              )}
            </button>

            {/* Half star/icon button (if half ratings allowed) */}
            {allowHalf && (
              <button
                type="button"
                className={cn(
                  "absolute inset-0 w-1/2 transition-all duration-150",
                  fieldApi.form.state.isSubmitting 
                    ? "cursor-not-allowed" 
                    : "cursor-pointer"
                )}
                onClick={() => handleRatingClick(getRatingValue(index, true))}
                onMouseEnter={() => handleMouseEnter(getRatingValue(index, true))}
                onMouseLeave={handleMouseLeave}
                disabled={fieldApi.form.state.isSubmitting}
                title={`Rate ${getRatingValue(index, true)} ${icon}s`}
              />
            )}
          </div>
        ))}
        
        {/* Clear rating button */}
        {value > 0 && (
          <button
            type="button"
            className={cn(
              "ml-2 text-xs text-muted-foreground hover:text-foreground transition-colors",
              fieldApi.form.state.isSubmitting ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            )}
            onClick={() => handleRatingClick(0)}
            disabled={fieldApi.form.state.isSubmitting}
            title="Clear rating"
          >
            Clear
          </button>
        )}
      </div>

      {state.meta.isTouched && state.meta.errors.length > 0 && (
        <div className="text-xs text-destructive pt-1">
          {state.meta.errors.map((err: string | Error, index: number) => (
            <p key={index}>{typeof err === 'string' ? err : (err as Error)?.message || 'Invalid'}</p>
          ))}
        </div>
      )}
    </div>
  );
}; 