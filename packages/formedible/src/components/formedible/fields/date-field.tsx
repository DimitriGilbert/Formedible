import React from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { BaseFieldProps } from '@/lib/formedible/types';
import { BaseFieldWrapper } from './base-field-wrapper';

export const DateField: React.FC<BaseFieldProps> = ({
  fieldApi,
  
  ...wrapperProps
}) => {
  if (!fieldApi.state) {
    console.error('DateField: fieldApi.state is undefined', fieldApi);
    return null;
  }

  const [isOpen, setIsOpen] = React.useState(false);

  const selectedDate = fieldApi.state.value
    ? fieldApi.state.value instanceof Date
      ? fieldApi.state.value
      : typeof fieldApi.state.value === 'string'
        ? parseISO(fieldApi.state.value)
        : undefined
    : undefined;

  const handleDateSelect = (date: Date | undefined) => {
    fieldApi.handleChange(date);
    fieldApi.handleBlur();
    setIsOpen(false);
  };

  return (
    <BaseFieldWrapper fieldApi={fieldApi} {...wrapperProps}>
      {({ isDisabled, inputClassName }) => (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground",
              inputClassName
            )}
            disabled={isDisabled}
            onClick={() => setIsOpen(true)}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, "PPP") : <span>{wrapperProps.placeholder || "Pick a date"}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
            disabled={fieldApi.form.state.isSubmitting}
          />
        </PopoverContent>
      </Popover>
      )}
    </BaseFieldWrapper>
  );
};
