import { ExternalLinkIcon, HelpCircleIcon } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Button } from '@formedible/ui/components/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@formedible/ui/components/field';
import type { FormedibleFieldController, FormedibleFormValues, FormedibleHelpConfig, NormalizedFieldConfig } from '@formedible/ui/components/formedible/lib/types';
import { cn } from '@formedible/ui/lib/utils';

const helpConfigKeys = new Set(['text', 'tooltip', 'position', 'link']);

/**
 * A help config is any plain object whose own keys are all known HelpConfig
 * keys. Shape-only configs (e.g. `{ position: 'top' }` with no content) count
 * too, so they render as empty help instead of crashing the ReactNode path
 * ("Objects are not valid as a React child"). React nodes such as elements,
 * fragments, and arrays carry foreign keys and keep flowing down that path.
 */
export function isFormedibleHelpConfig(help: ReactNode | FormedibleHelpConfig): help is FormedibleHelpConfig {
  return typeof help === 'object' && help !== null && Object.keys(help).every((key) => helpConfigKeys.has(key));
}

type HelpTooltipPosition = Required<FormedibleHelpConfig>['position'];

const tooltipPositionClasses: Record<NonNullable<HelpTooltipPosition>, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-1',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-1',
  left: 'right-full top-1/2 -translate-y-1/2 mr-1',
  right: 'left-full top-1/2 -translate-y-1/2 ml-1',
};

const tooltipArrowClasses: Record<NonNullable<HelpTooltipPosition>, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-black border-b-0',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-black border-t-0',
  left: 'top-1/2 left-full -translate-y-1/2 border-l-black border-r-0',
  right: 'top-1/2 right-full -translate-y-1/2 border-r-black border-l-0',
};

/**
 * Legacy tooltip behavior: an icon button that reveals an absolutely
 * positioned tooltip (with arrow) on hover, focus, or click.
 */
function FieldHelpTooltip({ tooltip, position = 'top' }: { readonly tooltip: ReactNode; readonly position?: HelpTooltipPosition }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-flex">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Field help"
        aria-expanded={showTooltip}
        data-formedible-help-tooltip="true"
        className="text-muted-foreground hover:text-foreground size-4"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        onClick={() => setShowTooltip((previous) => !previous)}
      >
        <HelpCircleIcon className="size-3.5" />
      </Button>

      {showTooltip ? (
        <div
          role="tooltip"
          data-formedible-help-tooltip-content="true"
          className={cn(
            'pointer-events-none absolute z-50 rounded bg-black px-2 py-1 text-xs whitespace-nowrap text-white shadow-lg',
            tooltipPositionClasses[position],
          )}
        >
          {tooltip}
          <div className={cn('absolute h-0 w-0 border-2 border-transparent', tooltipArrowClasses[position])} />
        </div>
      ) : undefined}
    </div>
  );
}

function FieldHelp({ help }: { readonly help: FormedibleHelpConfig }) {
  const hasContent = help.text !== undefined || help.tooltip !== undefined || help.link !== undefined;

  if (!hasContent) {
    return undefined;
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-formedible-field-help="true">
      {help.text !== undefined ? <FieldDescription className="flex items-start gap-1.5">{help.text}</FieldDescription> : undefined}
      {help.tooltip !== undefined ? <FieldHelpTooltip tooltip={help.tooltip} position={help.position} /> : undefined}
      {help.link ? (
        <a
          href={help.link.url}
          target="_blank"
          rel="noopener noreferrer"
          data-formedible-help-link="true"
          className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-xs underline-offset-4 hover:underline"
        >
          {help.link.text}
          <ExternalLinkIcon className="size-3" />
        </a>
      ) : undefined}
    </div>
  );
}

export interface FieldWrapperProps<TFormValues extends FormedibleFormValues = FormedibleFormValues> {
  readonly fieldConfig: NormalizedFieldConfig<TFormValues>;
  readonly field: FormedibleFieldController;
  readonly children: ReactNode;
}

export function FieldWrapper<TFormValues extends FormedibleFormValues>({ fieldConfig, field, children }: FieldWrapperProps<TFormValues>) {
  const help = fieldConfig.help;
  const plainHelpContent = !isFormedibleHelpConfig(help) ? help : undefined;

  return (
    <Field
      className={fieldConfig.className}
      data-disabled={fieldConfig.disabled ? 'true' : undefined}
      data-invalid={field.error ? 'true' : undefined}
      onFocusCapture={field.onFocus}
    >
      {fieldConfig.label ? (
        <FieldLabel htmlFor={field.id} className={fieldConfig.labelClassName}>
          {fieldConfig.label}
          {fieldConfig.required ? <span aria-hidden="true"> *</span> : undefined}
        </FieldLabel>
      ) : undefined}
      {children}
      {fieldConfig.description ? <FieldDescription>{fieldConfig.description}</FieldDescription> : undefined}
      {plainHelpContent ? <FieldDescription>{plainHelpContent}</FieldDescription> : undefined}
      {isFormedibleHelpConfig(help) ? <FieldHelp help={help} /> : undefined}
      {field.error ? <FieldError>{field.error}</FieldError> : undefined}
    </Field>
  );
}
