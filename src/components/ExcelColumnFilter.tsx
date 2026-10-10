import React, { useState, useRef, useEffect } from 'react';
import { Filter, ArrowUp, ArrowDown, Check, X, Search } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface ExcelColumnFilterProps {
  columnId: string;
  columnTitle: string;
  options: FilterOption[];
  selectedValues: string[];
  onChangeSelectedValues: (newSelected: string[]) => void;
  sortDirection: 'asc' | 'desc' | null;
  onSortChange: (direction: 'asc' | 'desc' | null) => void;
  numericFilter?: {
    min?: number;
    max?: number;
  };
  onNumericFilterChange?: (filter: { min?: number; max?: number }) => void;
  isNumeric?: boolean;
}

export const ExcelColumnFilter: React.FC<ExcelColumnFilterProps> = ({
  columnId: _columnId,
  columnTitle,
  options,
  selectedValues,
  onChangeSelectedValues,
  sortDirection,
  onSortChange,
  numericFilter,
  onNumericFilterChange,
  isNumeric = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  const isFiltered =
    (selectedValues.length > 0 && selectedValues.length < options.length) ||
    (numericFilter?.min !== undefined && numericFilter?.min > 0) ||
    sortDirection !== null;

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allSelected =
    options.length > 0 && selectedValues.length === options.length;

  const handleToggleAll = () => {
    if (allSelected) {
      onChangeSelectedValues([]);
    } else {
      onChangeSelectedValues(options.map((o) => o.value));
    }
  };

  const handleToggleValue = (val: string) => {
    if (selectedValues.includes(val)) {
      onChangeSelectedValues(selectedValues.filter((v) => v !== val));
    } else {
      onChangeSelectedValues([...selectedValues, val]);
    }
  };

  const handleClear = () => {
    onChangeSelectedValues(options.map((o) => o.value));
    onSortChange(null);
    if (onNumericFilterChange) {
      onNumericFilterChange({});
    }
    setIsOpen(false);
  };

  return (
    <div className="relative inline-flex items-center ml-1 text-left" ref={popoverRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`p-1 rounded transition flex items-center gap-0.5 ${
          isFiltered
            ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
            : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
        }`}
        title={`Filtro estilo Excel para ${columnTitle}`}
        aria-label={`Filtrar ${columnTitle}`}
      >
        <Filter className="w-3 h-3" />
        {sortDirection === 'asc' && <ArrowUp className="w-2.5 h-2.5 text-blue-300" />}
        {sortDirection === 'desc' && <ArrowDown className="w-2.5 h-2.5 text-blue-300" />}
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 top-full mt-1.5 w-64 bg-[#0c101d] border border-[#2a3854] rounded-xl shadow-2xl z-50 p-3 text-xs space-y-3 animate-fade-in font-normal text-slate-200"
          style={{ minWidth: '220px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1f293d] pb-2">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-blue-400" />
              Filtrar {columnTitle}
            </span>
            {isFiltered && (
              <button
                onClick={handleClear}
                className="text-[10px] text-blue-400 hover:text-blue-300 font-bold"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Sort Controls */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Classificar
            </span>
            <button
              onClick={() => {
                onSortChange(sortDirection === 'asc' ? null : 'asc');
              }}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition ${
                sortDirection === 'asc'
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <ArrowUp className="w-3.5 h-3.5 text-blue-400" />
                {isNumeric ? 'Menor para Maior (Crescente)' : 'De A a Z (Crescente)'}
              </span>
              {sortDirection === 'asc' && <Check className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => {
                onSortChange(sortDirection === 'desc' ? null : 'desc');
              }}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition ${
                sortDirection === 'desc'
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <ArrowDown className="w-3.5 h-3.5 text-blue-400" />
                {isNumeric ? 'Maior para Menor (Decrescente)' : 'De Z a A (Decrescente)'}
              </span>
              {sortDirection === 'desc' && <Check className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Quick Search inside values */}
          {options.length > 4 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar valor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#07090e] border border-[#1f293d] pl-7 pr-2 py-1 rounded-lg text-xs text-white outline-none focus:border-blue-500"
              />
            </div>
          )}

          {/* Values Checklist (Excel-style) */}
          {options.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5 text-[11px]">
                <button
                  onClick={handleToggleAll}
                  className="text-slate-400 hover:text-white font-medium flex items-center gap-1.5"
                >
                  <div
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                      allSelected
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'border-slate-600 bg-slate-900'
                    }`}
                  >
                    {allSelected && <Check className="w-2.5 h-2.5" />}
                  </div>
                  <span>(Selecionar Tudo)</span>
                </button>
                <span className="text-slate-500 text-[10px]">
                  {selectedValues.length}/{options.length}
                </span>
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-800/40">
                {filteredOptions.map((opt) => {
                  const isChecked = selectedValues.includes(opt.value);
                  return (
                    <label
                      key={opt.value}
                      className="flex items-center justify-between py-1 px-1 rounded hover:bg-slate-800/50 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div
                          className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                            isChecked
                              ? 'bg-blue-600 border-blue-500 text-white'
                              : 'border-slate-600 bg-slate-900'
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleToggleValue(opt.value);
                          }}
                        >
                          {isChecked && <Check className="w-2.5 h-2.5" />}
                        </div>
                        <span className="text-slate-300 text-xs truncate" title={opt.label}>
                          {opt.label}
                        </span>
                      </div>
                      {opt.count !== undefined && (
                        <span className="text-[10px] text-slate-500 font-mono ml-1 shrink-0">
                          ({opt.count})
                        </span>
                      )}
                    </label>
                  );
                })}

                {filteredOptions.length === 0 && (
                  <p className="text-center text-slate-500 py-2 text-[11px]">
                    Nenhum valor encontrado.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Footer Action */}
          <div className="pt-2 border-t border-[#1f293d] flex items-center justify-end gap-2">
            <button
              onClick={() => setIsOpen(false)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold px-3 py-1 rounded-lg transition"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
