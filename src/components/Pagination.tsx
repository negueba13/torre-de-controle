import { useEffect, useMemo, useState } from 'react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

export const PAGE_SIZE = 50;

export function usePagination<T>(
  items: T[],
  pageSize = PAGE_SIZE,
  resetKey: string = ''
) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [resetKey]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  return { currentPage, totalPages, pageItems, setCurrentPage };
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 50,
  onPageChange
}: PaginationControlsProps) {
  if (totalItems === 0) return null;

  const firstItem = (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between gap-3 py-3 text-xs text-slate-400">
      <span>
        Exibindo {firstItem}–{lastItem} de {totalItems}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="rounded border border-[#1f293d] px-3 py-1.5 text-slate-200 enabled:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Anterior
        </button>
        <span>
          Página {currentPage} de {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="rounded border border-[#1f293d] px-3 py-1.5 text-slate-200 enabled:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
