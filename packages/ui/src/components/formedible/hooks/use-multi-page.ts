import { useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { getValueAtFieldPath } from '@formedible/ui/components/formedible/lib/field-path';
import type { FormedibleFormValues, FormediblePageConfig, NormalizedFieldConfig } from '@formedible/ui/components/formedible/lib/types';

export interface UseMultiPageOptions<TFormValues extends FormedibleFormValues> {
  readonly fields: readonly NormalizedFieldConfig<TFormValues>[];
  readonly pages?: readonly FormediblePageConfig<TFormValues>[];
  readonly values: TFormValues;
  readonly onPageChange?: (context: { readonly fromPage: number; readonly toPage: number; readonly timeSpent: number }) => void;
}

export interface UseMultiPageResult {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly visiblePages: readonly number[];
  readonly goToNextPage: () => void;
  readonly goToPreviousPage: () => void;
  readonly setCurrentPage: Dispatch<SetStateAction<number>>;
  readonly isFirstPage: boolean;
  readonly isLastPage: boolean;
  readonly progressValue: number;
}

export function conditionMatches<TFormValues extends FormedibleFormValues>(
  conditional: NormalizedFieldConfig<TFormValues>['conditional'] | FormediblePageConfig<TFormValues>['conditional'],
  values: TFormValues,
) {
  if (!conditional) {
    return true;
  }

  if (typeof conditional === 'string') {
    return Boolean(getValueAtFieldPath(values, conditional));
  }

  return conditional(values);
}

export function getVisiblePageNumbers<TFormValues extends FormedibleFormValues>(
  fields: readonly NormalizedFieldConfig<TFormValues>[],
  pages: readonly FormediblePageConfig<TFormValues>[] | undefined,
  values: TFormValues,
) {
  const pageNumbers = Array.from(new Set(fields.map((field) => field.page ?? 1))).sort((first, second) => first - second);

  return pageNumbers.filter((pageNumber) => {
    const pageConfig = pages?.find((page) => page.page === pageNumber);

    if (!conditionMatches(pageConfig?.conditional, values)) {
      return false;
    }

    return fields.some((field) => (field.page ?? 1) === pageNumber && conditionMatches(field.conditional, values));
  });
}

export function useMultiPage<TFormValues extends FormedibleFormValues>({ fields, pages, values, onPageChange }: UseMultiPageOptions<TFormValues>): UseMultiPageResult {
  const initialPage = useMemo(() => getVisiblePageNumbers(fields, pages, values).at(0) ?? 1, [fields, pages, values]);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageStartedAt, setPageStartedAt] = useState(() => Date.now());
  const visiblePages = useMemo(() => getVisiblePageNumbers(fields, pages, values), [fields, pages, values]);
  const safeVisiblePages = visiblePages.length > 0 ? visiblePages : [1];
  const currentIndex = Math.max(safeVisiblePages.indexOf(currentPage), 0);
  const totalPages = safeVisiblePages.length;
  const isFirstPage = currentIndex === 0;
  const isLastPage = currentIndex === totalPages - 1;
  const progressValue = totalPages > 1 ? (currentIndex / (totalPages - 1)) * 100 : 100;

  useEffect(() => {
    if (!safeVisiblePages.includes(currentPage)) {
      setCurrentPage(safeVisiblePages.at(0) ?? 1);
    }
  }, [currentPage, safeVisiblePages]);

  function changePage(toPage: number) {
    if (toPage === currentPage || !safeVisiblePages.includes(toPage)) {
      return;
    }

    const now = Date.now();
    onPageChange?.({ fromPage: currentPage, toPage, timeSpent: now - pageStartedAt });
    setPageStartedAt(now);
    setCurrentPage(toPage);
  }

  function goToNextPage() {
    const nextPage = safeVisiblePages.at(currentIndex + 1);

    if (nextPage !== undefined) {
      changePage(nextPage);
    }
  }

  function goToPreviousPage() {
    const previousPage = safeVisiblePages.at(currentIndex - 1);

    if (previousPage !== undefined) {
      changePage(previousPage);
    }
  }

  return {
    currentPage,
    totalPages,
    visiblePages: safeVisiblePages,
    goToNextPage,
    goToPreviousPage,
    setCurrentPage,
    isFirstPage,
    isLastPage,
    progressValue,
  };
}
