import type { FormedibleAnalyticsConfig, FormedibleFormOptions, FormedibleFormValues, UseFormedibleOptions } from '../../packages/formedible/src/lib/formedible/types';
import type { RemovedUseFormedibleReturnFieldName } from './use-formedible-return-contract';

export type FormOptionsAnalyticsDisposition = 'restored' | 'removed-replace' | 'superseded';

/**
 * Strips the `[customProp: string]: unknown` index signatures from the package
 * option interfaces so only their DECLARED keys remain. Without this, `keyof`
 * would widen to `string` and the tie below would be vacuous.
 */
type DeclaredOptionKeys<T> = {
  [K in keyof T as string extends K ? never : number extends K ? never : symbol extends K ? never : K]: T[K];
};

/**
 * Every contract row `option` must be a key that exists in the current package
 * option types, so a package rename/removal (or a fixture typo) breaks the
 * build instead of silently drifting. The two exceptions are intentional:
 * - `autoScroll` is a documented divergence: the legacy option does not exist
 *   in the current package types (the runtime always smooth-scrolls to the
 *   first invalid field on invalid submit).
 * - `${name} return helper` rows describe keys of the hook's RETURN value,
 *   which live in `use-formedible-return-contract.ts`, not in the option types.
 */
export type ContractOptionKey =
  | Extract<keyof DeclaredOptionKeys<UseFormedibleOptions<FormedibleFormValues>>, string>
  | `formOptions.${Extract<keyof DeclaredOptionKeys<FormedibleFormOptions<FormedibleFormValues>>, string>}`
  | `analytics.${Extract<keyof DeclaredOptionKeys<FormedibleAnalyticsConfig<FormedibleFormValues>>, string>}`
  | `${RemovedUseFormedibleReturnFieldName} return helper`
  | 'autoScroll';

export type FormOptionsAnalyticsContractRow = Readonly<{
  option: ContractOptionKey;
  disposition: FormOptionsAnalyticsDisposition;
  reason: string;
}>;

const restoredReason = 'Restored in the package-level public API for compatibility with old examples and public ergonomics.';
const supersededReason = 'Superseded by current TanStack Form validation state, rendered errors, or existing package configuration.';
const removedDebugReason = 'Removed debug/validation helper; do not restore without an explicit product decision.';

export const formOptionsAnalyticsContract = [
  { option: 'onPageChange', disposition: 'restored', reason: restoredReason },
  { option: 'formOptions.onChange', disposition: 'restored', reason: restoredReason },
  { option: 'formOptions.onBlur', disposition: 'restored', reason: restoredReason },
  { option: 'formOptions.onFocus', disposition: 'restored', reason: restoredReason },
  { option: 'formOptions.onReset', disposition: 'restored', reason: restoredReason },
  { option: 'onFormReset', disposition: 'restored', reason: restoredReason },
  { option: 'onFormInput', disposition: 'restored', reason: restoredReason },
  { option: 'onFormInvalid', disposition: 'restored', reason: restoredReason },
  { option: 'onFormKeyDown', disposition: 'restored', reason: restoredReason },
  { option: 'onFormKeyUp', disposition: 'restored', reason: restoredReason },
  { option: 'onFormFocus', disposition: 'restored', reason: restoredReason },
  { option: 'onFormBlur', disposition: 'restored', reason: restoredReason },
  { option: 'disabled', disposition: 'restored', reason: restoredReason },
  { option: 'loading', disposition: 'restored', reason: restoredReason },
  { option: 'showSubmitButton', disposition: 'restored', reason: restoredReason },
  { option: 'autoSubmitOnChange', disposition: 'restored', reason: restoredReason },
  { option: 'autoSubmitDebounceMs', disposition: 'restored', reason: restoredReason },
  { option: 'analytics.onFormStart', disposition: 'restored', reason: restoredReason },
  { option: 'analytics.onFieldFocus', disposition: 'restored', reason: restoredReason },
  { option: 'analytics.onFieldBlur', disposition: 'restored', reason: restoredReason },
  { option: 'analytics.onFieldChange', disposition: 'restored', reason: restoredReason },
  { option: 'analytics.onFieldComplete', disposition: 'restored', reason: restoredReason },
  { option: 'analytics.onFieldError', disposition: 'restored', reason: restoredReason },
  { option: 'analytics.onPageChange', disposition: 'restored', reason: restoredReason },
  { option: 'analytics.onPageComplete', disposition: 'superseded', reason: 'No current package runtime event truthfully emits page completion analytics.' },
  { option: 'analytics.onPageAbandon', disposition: 'superseded', reason: 'No current package runtime event truthfully emits page abandonment analytics.' },
  { option: 'analytics.onPageValidationError', disposition: 'superseded', reason: supersededReason },
  { option: 'analytics.onTabChange', disposition: 'restored', reason: 'Restored: fired from use-form-tabs on tab switch with the legacy fromTab/toTab/timeSpent/tab-completion arguments.' },
  { option: 'analytics.onTabComplete', disposition: 'superseded', reason: 'No current package runtime event truthfully emits tab analytics.' },
  { option: 'analytics.onTabAbandon', disposition: 'superseded', reason: 'No current package runtime event truthfully emits tab analytics.' },
  { option: 'analytics.onTabValidationError', disposition: 'superseded', reason: 'No current package runtime event truthfully emits tab analytics.' },
  { option: 'analytics.onTabFirstVisit', disposition: 'restored', reason: 'Restored: fired the first time a tab becomes active, including the initial tab on mount.' },
  { option: 'analytics.onFormComplete', disposition: 'restored', reason: restoredReason },
  { option: 'analytics.onFormAbandon', disposition: 'restored', reason: restoredReason },
  { option: 'analytics.onFormReset', disposition: 'restored', reason: restoredReason },
  { option: 'analytics.onRenderPerformance', disposition: 'superseded', reason: 'No current package runtime measures render performance.' },
  { option: 'analytics.onValidationPerformance', disposition: 'superseded', reason: 'No current package runtime measures validation performance.' },
  { option: 'analytics.onSubmissionPerformance', disposition: 'restored', reason: 'Restored: fired after a successful submit with the legacy submissionTime/validationTime/processingTime arguments.' },
  {
    option: 'resetOnSubmitSuccess',
    disposition: 'restored',
    reason: 'Restored: a successful submit resets the form to its default values by default; resetOnSubmitSuccess: false keeps the submitted values (legacy main behavior).',
  },
  {
    option: 'autoScroll',
    disposition: 'superseded',
    reason: 'Documented divergence: the runtime unconditionally smooth-scrolls and focuses the first invalid field on invalid submit; legacy autoScroll only toggled scroll-to-top during navigation.',
  },
  { option: 'fieldClassName', disposition: 'restored', reason: 'Restored: appended to every field wrapper alongside each field own className.' },
  { option: 'labelClassName', disposition: 'restored', reason: 'Restored: appended to every field label alongside each field own labelClassName.' },
  { option: 'buttonClassName', disposition: 'restored', reason: 'Restored: applied to the Previous/Next navigation buttons.' },
  { option: 'submitButtonClassName', disposition: 'restored', reason: 'Restored: applied to the submit button.' },
  { option: 'formOptions.onSubmitInvalid', disposition: 'restored', reason: 'Restored: typed as the standard TanStack Form submit-invalid callback and forwarded verbatim from the underlying useForm config.' },
  { option: 'crossFieldErrors return helper', disposition: 'removed-replace', reason: removedDebugReason },
  { option: 'asyncValidationStates return helper', disposition: 'removed-replace', reason: removedDebugReason },
  { option: 'validateCrossFields return helper', disposition: 'removed-replace', reason: removedDebugReason },
  { option: 'validateFieldAsync return helper', disposition: 'removed-replace', reason: removedDebugReason },
] satisfies readonly FormOptionsAnalyticsContractRow[];

export const restoredFormOptionsAnalytics = formOptionsAnalyticsContract
  .filter((row) => row.disposition === 'restored')
  .map((row) => row.option);

export const intentionallyRemovedFormOptionsAnalytics = formOptionsAnalyticsContract
  .filter((row) => row.disposition === 'removed-replace')
  .map((row) => row.option);
