import React, { useState, useEffect, useRef } from 'react';
import { Search, Calendar } from 'lucide-react';

interface TableFilterProps {
  onFilterChange: (filters: { search: string; startDate: string; endDate: string; category?: string }) => void;
  placeholder?: string;
  initialSearch?: string;
  categories?: { label: string; value: string }[];
}

export function TableFilter({ 
  onFilterChange, 
  placeholder = "Tìm kiếm...", 
  initialSearch = "",
  categories
}: TableFilterProps) {
  const [search, setSearch] = useState(initialSearch);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [category, setCategory] = useState("");
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      onFilterChange({ search, startDate, endDate, category });
    }, 400);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [search, startDate, endDate, category, onFilterChange]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 p-4 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {categories && categories.length > 0 && (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        )}
        <div className="relative flex items-center">
          <Calendar className="absolute left-3 h-4 w-4 text-gray-400" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-9 w-36 rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <span className="text-gray-400">-</span>
        <div className="relative flex items-center">
          <Calendar className="absolute left-3 h-4 w-4 text-gray-400" />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-9 w-36 rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        {(search || startDate || endDate || category) && (
          <button
            onClick={() => {
              setSearch("");
              setStartDate("");
              setEndDate("");
              setCategory("");
            }}
            className="h-9 px-3 text-sm text-red-500 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/20"
          >
            Xóa lọc
          </button>
        )}
      </div>
    </div>
  );
}
