import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  label?: string;
  value: string;
  options: (SelectOption | string)[];
  onChange: (value: string, selectedOption?: SelectOption) => void;
  onClear?: () => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
  id?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  value,
  options,
  onChange,
  onClear,
  placeholder = "Type or select...",
  disabled = false,
  required = false,
  error,
  className,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal query with external value changes
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  // Normalize options to { value, label }
  const normalizedOptions: SelectOption[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === "string") {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  // Filtered list based on search query
  const filteredOptions = useMemo(() => {
    if (!query.trim()) return normalizedOptions;
    const lower = query.toLowerCase();
    const matches = normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(lower) || opt.value.toLowerCase().includes(lower)
    );
    return matches.length > 0 ? matches : normalizedOptions;
  }, [normalizedOptions, query]);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setQuery(newVal);
    setIsOpen(true);
    const matched = normalizedOptions.find(
      (opt) =>
        opt.label.toLowerCase() === newVal.toLowerCase() ||
        opt.value.toLowerCase() === newVal.toLowerCase()
    );
    onChange(newVal, matched);
  };

  const handleSelect = (option: SelectOption) => {
    setQuery(option.label);
    onChange(option.label, option);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuery("");
    onChange("", undefined);
    if (onClear) onClear();
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 pr-16 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-colors focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:opacity-60",
            error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20"
          )}
        />

        <div className="absolute right-2.5 flex items-center gap-1 text-slate-400">
          {query && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Clear text"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className="p-1 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <ChevronDown
              className={cn("w-4 h-4 transition-transform duration-200", isOpen && "rotate-180")}
            />
          </button>
        </div>
      </div>

      {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}

      {/* Dropdown Options Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl max-h-60 overflow-y-auto py-1">
          {filteredOptions.length === 0 ? (
            <div className="px-3.5 py-2.5 text-xs text-slate-400">No matching results found</div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected =
                opt.label.toLowerCase() === (value || "").toLowerCase() ||
                opt.value.toLowerCase() === (value || "").toLowerCase();
              return (
                <button
                  key={`${opt.value}-${opt.label}`}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={cn(
                    "w-full text-left px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors flex items-center justify-between hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-700 dark:hover:text-amber-300",
                    isSelected
                      ? "bg-amber-50/80 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-bold"
                      : "text-slate-700 dark:text-slate-300"
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0 ml-2" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
