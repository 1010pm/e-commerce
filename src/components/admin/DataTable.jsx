/**
 * Data Table Component
 * Modern table with sorting, filtering, and pagination
 */

import React from 'react';
import {
  ChevronUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

const DataTable = ({
  columns,
  data,
  onRowClick,
  sortBy,
  sortDirection,
  onSort,
  loading = false,
  rowClassName = () => '',
}) => {
  const handleSort = (columnKey) => {
    if (onSort) {
      const newDirection = sortBy === columnKey && sortDirection === 'asc' ? 'desc' : 'asc';
      onSort(columnKey, newDirection);
    }
  };

  const getSortIcon = (columnKey) => {
    if (sortBy !== columnKey) {
      return <ChevronUpDownIcon className="w-4 h-4 opacity-40" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUpIcon className="w-4 h-4" />
    ) : (
      <ChevronDownIcon className="w-4 h-4" />
    );
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {columns.map((column) => (
              <th
                key={column.key}
                onClick={() => column.sortable && handleSort(column.key)}
                className={`
                  px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide
                  ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}
                `}
              >
                <div className="flex items-center gap-2">
                  {column.label}
                  {column.sortable && getSortIcon(column.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data && data.length > 0 ? (
            data.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                onClick={() => onRowClick && onRowClick(row)}
                className={`
                  border-b border-gray-200 transition-colors duration-200
                  hover:bg-gray-50
                  ${onRowClick ? 'cursor-pointer' : ''}
                  ${rowClassName(row)}
                `}
              >
                {columns.map((column) => (
                  <td
                    key={`${rowIdx}-${column.key}`}
                    className="px-6 py-4 text-sm text-gray-600"
                  >
                    {column.render
                      ? column.render(row[column.key], row, rowIdx)
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                {loading ? 'Loading...' : 'No data found'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
