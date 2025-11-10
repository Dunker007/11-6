import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * Virtual Scrolling Hook
 * Only renders visible items in a list for better performance
 */
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
    }));
  }, [items, startIndex, endIndex]);

  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    startIndex,
    endIndex,
    handleScroll,
  };
}

/**
 * Pagination Hook
 * Manages pagination state and calculations
 */
export function usePagination<T>(
  items: T[],
  itemsPerPage: number = 20
) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex]
  );

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const previousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  // Reset to page 1 when items change significantly
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  return {
    currentPage,
    totalPages,
    paginatedItems,
    startIndex,
    endIndex,
    totalItems: items.length,
    goToPage,
    nextPage,
    previousPage,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  };
}

/**
 * Lazy Loading Hook
 * Loads data incrementally as user scrolls
 */
export function useLazyLoad<T>(
  loadMore: () => Promise<T[]>,
  initialItems: T[] = [],
  pageSize: number = 20
) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadMoreItems = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const newItems = await loadMore();
      if (newItems.length === 0 || newItems.length < pageSize) {
        setHasMore(false);
      }
      setItems((prev) => [...prev, ...newItems]);
    } catch (err) {
      setError(err as Error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [loadMore, isLoading, hasMore, pageSize]);

  const reset = useCallback(() => {
    setItems(initialItems);
    setHasMore(true);
    setError(null);
  }, [initialItems]);

  return {
    items,
    isLoading,
    hasMore,
    error,
    loadMoreItems,
    reset,
  };
}

/**
 * Optimistic Update Hook
 * Updates UI immediately, then syncs with server
 */
export function useOptimisticUpdate<T>(
  initialValue: T,
  updateFn: (value: T) => Promise<T>,
  rollbackFn?: (value: T) => void
) {
  const [value, setValue] = useState<T>(initialValue);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const previousValueRef = useRef<T>(initialValue);

  const update = useCallback(
    async (newValue: T) => {
      // Store previous value for rollback
      previousValueRef.current = value;

      // Optimistically update UI
      setValue(newValue);
      setIsUpdating(true);
      setError(null);

      try {
        // Sync with server
        const syncedValue = await updateFn(newValue);
        setValue(syncedValue);
      } catch (err) {
        // Rollback on error
        if (rollbackFn) {
          rollbackFn(previousValueRef.current);
        }
        setValue(previousValueRef.current);
        setError(err as Error);
      } finally {
        setIsUpdating(false);
      }
    },
    [value, updateFn, rollbackFn]
  );

  return {
    value,
    isUpdating,
    error,
    update,
  };
}

/**
 * Debounced Search Hook (already exists but enhanced)
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

