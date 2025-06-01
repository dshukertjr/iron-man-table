import React from 'react';
import { useSupabaseTables } from '../hooks/useSupabaseTables';

interface TableListProps {
  onTableDrag?: (tableName: string, x: number, y: number) => void;
}

const TableList: React.FC<TableListProps> = ({ onTableDrag }) => {
  const { tables, loading, error } = useSupabaseTables();

  // For demo purposes, if no tables are found, show some example tables
  const displayTables = tables.length > 0 ? tables : ['users', 'posts', 'comments', 'products'];

  return (
    <div className="absolute left-0 top-0 h-full w-20 bg-gray-900 bg-opacity-80 border-r border-gray-700 flex flex-col items-center py-4 gap-4 overflow-y-auto">
      <h3 className="text-white text-xs font-semibold mb-2 rotate-90 origin-center whitespace-nowrap">
        Tables
      </h3>
      
      {loading && (
        <div className="text-gray-400 text-xs">Loading...</div>
      )}
      
      {error && (
        <div className="text-red-400 text-xs text-center px-2">
          {error}
        </div>
      )}
      
      {!loading && displayTables.map((table, index) => (
        <div
          key={table}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center cursor-move transition-colors shadow-lg group"
          data-table={table}
          title={table}
        >
          {/* Table Icon SVG */}
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          
          {/* Table name tooltip on hover */}
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            {table}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TableList;