import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  itemLabel = 'elementos',
  className = ''
}) => {
  if (totalItems === 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);

  // If total items is small (e.g. <= lowest page size option) and we're on page 1, show a clean compact indicator without pagination clutter
  const isSingleSmallPage = totalItems <= pageSizeOptions[0] && totalPages === 1;

  // Calculate visible page numbers
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (safePage <= 3) {
        pages.push(1, 2, 3, 4, 'ellipsis', totalPages);
      } else if (safePage >= totalPages - 2) {
        pages.push(1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, 'ellipsis', safePage - 1, safePage, safePage + 1, 'ellipsis', totalPages);
      }
    }
    return pages;
  };

  return (
    <nav
      aria-label="Paginación de resultados"
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-[#FCFAF7] border-t border-[#EDE4D7] rounded-b-2xl text-xs text-[#574B45] ${className}`}
    >
      {/* Left: Summary and Page Size Selector */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-medium text-[#26201D]">
          Mostrando <strong className="text-[#521849] font-bold">{startItem}–{endItem}</strong> de <strong className="text-[#26201D] font-bold">{totalItems}</strong> {itemLabel}
        </span>

        {onPageSizeChange && totalItems > 10 && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-[#EDE4D7]">
            <label htmlFor="pagination-page-size" className="text-[#574B45] text-[11px] whitespace-nowrap">
              Por página:
            </label>
            <select
              id="pagination-page-size"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Seleccionar elementos por página"
              className="px-2 py-1 bg-white border border-[#EDE4D7] rounded-lg text-xs font-semibold text-[#26201D] focus:outline-hidden focus:ring-2 focus:ring-[#521849] cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page Navigation Controls (Hidden or simplified if only 1 page with few items) */}
      {!isSingleSmallPage && totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* First Page */}
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={safePage <= 1}
            aria-label="Primera página"
            title="Primera página"
            className="p-1.5 rounded-lg border border-[#EDE4D7] bg-white text-[#574B45] hover:bg-[#F6F1EA] hover:text-[#26201D] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>

          {/* Previous Page */}
          <button
            type="button"
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage <= 1}
            aria-label="Página anterior"
            title="Página anterior"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#EDE4D7] bg-white text-[#574B45] hover:bg-[#F6F1EA] hover:text-[#26201D] disabled:opacity-30 disabled:pointer-events-none transition-colors font-medium cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          {/* Numeric Page Buttons */}
          <div className="flex items-center gap-1 px-1">
            {getPageNumbers().map((pageItem, idx) => {
              if (pageItem === 'ellipsis') {
                return (
                  <span key={`ellipsis-${idx}`} className="px-1.5 py-1 text-[#8C7E74] select-none text-xs">
                    …
                  </span>
                );
              }
              const isCurrent = pageItem === safePage;
              return (
                <button
                  key={`page-${pageItem}`}
                  type="button"
                  onClick={() => onPageChange(pageItem)}
                  aria-label={`Ir a página ${pageItem}`}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-[#521849] text-white shadow-xs'
                      : 'border border-[#EDE4D7] bg-white text-[#574B45] hover:bg-[#F6F1EA] hover:text-[#26201D]'
                  }`}
                >
                  {pageItem}
                </button>
              );
            })}
          </div>

          {/* Next Page */}
          <button
            type="button"
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage >= totalPages}
            aria-label="Página siguiente"
            title="Página siguiente"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#EDE4D7] bg-white text-[#574B45] hover:bg-[#F6F1EA] hover:text-[#26201D] disabled:opacity-30 disabled:pointer-events-none transition-colors font-medium cursor-pointer"
          >
            <span className="hidden sm:inline">Siguiente</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Last Page */}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={safePage >= totalPages}
            aria-label="Última página"
            title="Última página"
            className="p-1.5 rounded-lg border border-[#EDE4D7] bg-white text-[#574B45] hover:bg-[#F6F1EA] hover:text-[#26201D] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </nav>
  );
};
