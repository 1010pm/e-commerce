/**
 * Filter Bar Component
 * Modern filter and search controls
 */

import React from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

const FilterBar = ({
  searchValue,
  onSearchChange,
  filters = [],
  onFilterChange,
  hasActiveFilters = false,
  onClearFilters,
}) => {
  const [showFilters, setShowFilters] = React.useState(false);

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`
            px-4 py-2 border rounded-lg font-medium transition-colors
            flex items-center gap-2
            ${hasActiveFilters
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }
          `}
        >
          <FunnelIcon className="w-5 h-5" />
          Filters
          {hasActiveFilters && <span className="ml-1 text-sm">●</span>}
        </button>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filter Dropdowns */}
      {showFilters && filters.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          {filters.map((filter) => (
            <div key={filter.key}>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                {filter.label}
              </label>
              <select
                value={filter.value || ''}
                onChange={(e) => onFilterChange(filter.key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All</option>
                {filter.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
