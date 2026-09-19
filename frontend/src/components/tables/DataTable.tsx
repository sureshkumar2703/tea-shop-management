import React, { useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { Input } from "../ui/Input";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchKey?: string;
  searchPlaceholder?: string;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  actions?: React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search records...",
  pageSize = 10,
  emptyTitle = "No records found",
  emptyDescription = "There are no entries available for this view.",
  actions,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    if (!searchTerm || !searchKey) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((item) => {
      const val = item[searchKey];
      if (typeof val === "string") return val.toLowerCase().includes(term);
      if (typeof val === "number") return val.toString().includes(term);
      return false;
    });
  }, [data, searchTerm, searchKey]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  return (
    <div className="space-y-4">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {searchKey ? (
          <div className="w-full sm:max-w-xs">
            <Input
              icon={<Search className="w-4 h-4" />}
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        ) : (
          <div />
        )}
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className={`px-4 py-3.5 ${col.className || ""}`}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {paginatedData.length > 0 ? (
                paginatedData.map((item, idx) => (
                  <tr
                    key={item.id || idx}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={`px-4 py-3.5 ${col.className || ""}`}>
                        {col.render ? col.render(item) : item[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Inbox className="w-10 h-10 mb-2 stroke-[1.5]" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {emptyTitle}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm">
                        {emptyDescription}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {filteredData.length > pageSize && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <span>
              Showing {Math.min((currentPage - 1) * pageSize + 1, filteredData.length)} to{" "}
              {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} entries
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-medium">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
