export type ReturnContractDisposition = 'keep' | 'remove-replace';

/**
 * The removed return-helper names, as a literal union so other fixtures can
 * derive type-level keys (e.g. `formOptionsAnalyticsContract` rows) from the
 * same single source instead of hand-copying the names again.
 */
export type RemovedUseFormedibleReturnFieldName = 'crossFieldErrors' | 'asyncValidationStates' | 'validateCrossFields' | 'validateFieldAsync';

export type UseFormedibleReturnContractRow = Readonly<{
  field: string;
  disposition: ReturnContractDisposition;
  reason: string;
}>;

const keepReason = 'Preserved public helper used by compatibility examples or existing consumer ergonomics.';
const replaceReason =
  'Old custom validation/debug state should be replaced through TanStack Form validators, rendered errors, and form state.';

export const useFormedibleReturnContract = [
  { field: 'form', disposition: 'keep', reason: keepReason },
  { field: 'Form', disposition: 'keep', reason: keepReason },
  { field: 'currentPage', disposition: 'keep', reason: keepReason },
  { field: 'totalPages', disposition: 'keep', reason: keepReason },
  { field: 'visiblePages', disposition: 'keep', reason: keepReason },
  { field: 'goToNextPage', disposition: 'keep', reason: keepReason },
  { field: 'goToPreviousPage', disposition: 'keep', reason: keepReason },
  { field: 'setCurrentPage', disposition: 'keep', reason: keepReason },
  { field: 'isFirstPage', disposition: 'keep', reason: keepReason },
  { field: 'isLastPage', disposition: 'keep', reason: keepReason },
  { field: 'progressValue', disposition: 'keep', reason: keepReason },
  { field: 'saveToStorage', disposition: 'keep', reason: keepReason },
  { field: 'loadFromStorage', disposition: 'keep', reason: keepReason },
  { field: 'clearStorage', disposition: 'keep', reason: keepReason },
  { field: 'crossFieldErrors', disposition: 'remove-replace', reason: replaceReason },
  { field: 'asyncValidationStates', disposition: 'remove-replace', reason: replaceReason },
  { field: 'validateCrossFields', disposition: 'remove-replace', reason: replaceReason },
  { field: 'validateFieldAsync', disposition: 'remove-replace', reason: replaceReason },
] satisfies readonly UseFormedibleReturnContractRow[];

export const keptUseFormedibleReturnFields = useFormedibleReturnContract
  .filter((row) => row.disposition === 'keep')
  .map((row) => row.field);

export const removedUseFormedibleReturnFields = useFormedibleReturnContract
  .filter((row) => row.disposition === 'remove-replace')
  .map((row) => row.field);
