export type FormOptionsAnalyticsDisposition = 'restored' | 'removed-replace' | 'superseded';

export type FormOptionsAnalyticsContractRow = Readonly<{
  option: string;
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
  { option: 'analytics.onTabChange', disposition: 'superseded', reason: 'No current package runtime event truthfully emits tab analytics.' },
  { option: 'analytics.onTabComplete', disposition: 'superseded', reason: 'No current package runtime event truthfully emits tab analytics.' },
  { option: 'analytics.onTabAbandon', disposition: 'superseded', reason: 'No current package runtime event truthfully emits tab analytics.' },
  { option: 'analytics.onTabValidationError', disposition: 'superseded', reason: 'No current package runtime event truthfully emits tab analytics.' },
  { option: 'analytics.onTabFirstVisit', disposition: 'superseded', reason: 'No current package runtime event truthfully emits tab analytics.' },
  { option: 'analytics.onFormComplete', disposition: 'restored', reason: restoredReason },
  { option: 'analytics.onFormAbandon', disposition: 'restored', reason: restoredReason },
  { option: 'analytics.onFormReset', disposition: 'restored', reason: restoredReason },
  { option: 'analytics.onRenderPerformance', disposition: 'superseded', reason: 'No current package runtime measures render performance.' },
  { option: 'analytics.onValidationPerformance', disposition: 'superseded', reason: 'No current package runtime measures validation performance.' },
  { option: 'analytics.onSubmissionPerformance', disposition: 'superseded', reason: 'No current package runtime measures submission performance.' },
  { option: 'resetOnSubmitSuccess', disposition: 'superseded', reason: supersededReason },
  { option: 'autoScroll', disposition: 'superseded', reason: supersededReason },
  { option: 'fieldClassName', disposition: 'superseded', reason: 'Use per-field className or globalWrapper for package-level styling.' },
  { option: 'labelClassName', disposition: 'superseded', reason: 'Use wrapper components for package-level label customization.' },
  { option: 'buttonClassName', disposition: 'superseded', reason: 'Use current button components or custom composition around the returned Form.' },
  { option: 'submitButtonClassName', disposition: 'superseded', reason: 'Use current button components or custom composition around the returned Form.' },
  { option: 'formOptions.onSubmitInvalid', disposition: 'removed-replace', reason: removedDebugReason },
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
