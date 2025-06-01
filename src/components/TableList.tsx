import React from 'react';
import { useSupabaseTables } from '../hooks/useSupabaseTables';

export interface TableObject {
  id: string;
  name: string;
  x: number;
  y: number;
  isDragging: boolean;
}

interface TableListProps {
  tables: TableObject[];
  onTableAdd: (tableName: string) => void;
}

const TableList: React.FC<TableListProps> = ({ tables, onTableAdd }) => {
  const { tables: availableTables, loading, error } = useSupabaseTables();

  // For demo purposes, if no tables are found, show some example tables
  const displayTables = availableTables.length > 0 ? availableTables : ['users', 'posts', 'comments', 'products'];

  // Filter out tables that are already on the canvas
  const unusedTables = displayTables.filter(
    tableName => !tables.some(t => t.name === tableName)
  );

  return (
    <div className="absolute left-0 right-0 top-0 h-20 bg-gray-900 bg-opacity-80 border-b border-gray-700 flex items-center px-4 gap-4 overflow-x-auto">
      <h3 className="text-white text-sm font-semibold whitespace-nowrap">
        Tables:
      </h3>
      
      {loading && (
        <div className="text-gray-400 text-xs">Loading...</div>
      )}
      
      {error && (
        <div className="text-red-400 text-xs">
          Using example tables
        </div>
      )}
      
      {!loading && unusedTables.map((table) => (
        <button
          key={table}
          onClick={() => onTableAdd(table)}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center cursor-pointer transition-colors shadow-lg group flex-shrink-0"
          title={`Add ${table} table`}
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
          <div className="absolute top-full mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            {table}
          </div>
        </button>
      ))}
      
      {!loading && unusedTables.length === 0 && (
        <div className="text-gray-400 text-sm">
          All tables are on the canvas
        </div>
      )}
    </div>
  );
};

export default TableList;