import type { ComponentProps, KeyboardEvent, ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

import { cn } from '@formedible/ui/lib/utils';

type CommandContextValue = {
  readonly query: string;
  readonly setQuery: (query: string) => void;
};

const CommandContext = createContext<CommandContextValue | null>(null);

type CommandProps = ComponentProps<'div'>;

type CommandInputProps = Omit<ComponentProps<'input'>, 'onChange' | 'value'> & {
  readonly value?: string;
  readonly onValueChange?: (value: string) => void;
};

type CommandItemProps = Omit<ComponentProps<'button'>, 'onSelect' | 'value'> & {
  readonly value: string;
  readonly onSelect?: (value: string) => void;
};

function getCommandItems(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLButtonElement>('[data-command-item="true"]')).filter((item) => !item.disabled && item.getAttribute('aria-disabled') !== 'true' && !item.hidden);
}

function Command({ className, onKeyDown, ...props }: CommandProps) {
  const [query, setQuery] = useState('');
  const contextValue = useMemo<CommandContextValue>(() => ({ query, setQuery }), [query]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);

    if (event.defaultPrevented || (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')) {
      return;
    }

    const items = getCommandItems(event.currentTarget);

    if (items.length === 0) {
      return;
    }

    event.preventDefault();

    const activeElement = document.activeElement;
    const currentIndex = activeElement instanceof HTMLButtonElement ? items.indexOf(activeElement) : -1;
    const nextIndex = event.key === 'ArrowDown' ? (currentIndex + 1) % items.length : (currentIndex - 1 + items.length) % items.length;
    items[nextIndex]?.focus();
  }

  return (
    <CommandContext.Provider value={contextValue}>
      <div data-slot="command" role="listbox" className={cn('flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground', className)} onKeyDown={handleKeyDown} {...props} />
    </CommandContext.Provider>
  );
}

function CommandInput({ className, value, onValueChange, ...props }: CommandInputProps) {
  const context = useContext(CommandContext);
  const inputValue = value ?? context?.query ?? '';

  return (
    <div data-slot="command-input-wrapper" className="flex h-9 items-center border-b px-3">
      <input
        data-slot="command-input"
        role="searchbox"
        className={cn('placeholder:text-muted-foreground flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50', className)}
        value={inputValue}
        onChange={(event) => {
          const nextValue = event.target.value;
          context?.setQuery(nextValue);
          onValueChange?.(nextValue);
        }}
        {...props}
      />
    </div>
  );
}

function CommandList({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="command-list" className={cn('max-h-60 overflow-x-hidden overflow-y-auto p-1', className)} {...props} />;
}

function CommandEmpty({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="command-empty" className={cn('py-6 text-center text-sm text-muted-foreground', className)} {...props} />;
}

function CommandGroup({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="command-group" className={cn('overflow-hidden p-1 text-foreground', className)} {...props} />;
}

function CommandItem({ className, value, onSelect, disabled, children, ...props }: CommandItemProps) {
  return (
    <button
      data-command-item="true"
      data-slot="command-item"
      type="button"
      role="option"
      disabled={disabled}
      aria-disabled={disabled}
      className={cn(
        'relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      onClick={() => onSelect?.(value)}
      {...props}
    >
      {children as ReactNode}
    </button>
  );
}

export { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList };
