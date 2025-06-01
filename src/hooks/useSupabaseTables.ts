import { useEffect, useState } from 'react';

interface TableSchema {
  name: string;
  columns: { name: string; type: string; foreignKey?: string }[];
}

interface TableRelationship {
  table1: string;
  table2: string;
  foreignKey: string;
  referencingTable: string;
  referencedTable: string;
}

export const useSupabaseTables = () => {
  const [tables, setTables] = useState<string[]>([]);
  const [tableSchemas, setTableSchemas] = useState<TableSchema[]>([]);
  const [relationships, setRelationships] = useState<TableRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const detectForeignKeys = (tableName: string, columns: any[]): { name: string; type: string; foreignKey?: string }[] => {
    return columns.map(col => {
      const columnInfo: { name: string; type: string; foreignKey?: string } = {
        name: col.column_name,
        type: col.data_type
      };

      // Detect foreign key patterns
      const colName = col.column_name.toLowerCase();
      if (colName.endsWith('_id') || colName.endsWith('id')) {
        // Extract referenced table name
        let referencedTable = '';
        if (colName.endsWith('_id')) {
          referencedTable = colName.slice(0, -3); // Remove '_id'
        } else if (colName !== 'id' && colName.endsWith('id')) {
          referencedTable = colName.slice(0, -2); // Remove 'id'
        }
        
        if (referencedTable && referencedTable !== tableName.toLowerCase()) {
          columnInfo.foreignKey = referencedTable;
        }
      }

      return columnInfo;
    });
  };

  const findTableRelationships = (schemas: TableSchema[]): TableRelationship[] => {
    const relationships: TableRelationship[] = [];
    
    schemas.forEach(schema => {
      schema.columns.forEach(column => {
        if (column.foreignKey) {
          // Check if the referenced table exists
          const referencedTable = schemas.find(s => 
            s.name.toLowerCase() === column.foreignKey?.toLowerCase() ||
            s.name.toLowerCase() === column.foreignKey?.toLowerCase() + 's' ||
            s.name.toLowerCase() === column.foreignKey?.toLowerCase().slice(0, -1) // singular form
          );
          
          if (referencedTable) {
            relationships.push({
              table1: schema.name,
              table2: referencedTable.name,
              foreignKey: column.name,
              referencingTable: schema.name,
              referencedTable: referencedTable.name
            });
          }
        }
      });
    });
    
    return relationships;
  };

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
          setError('Supabase credentials not configured');
          setLoading(false);
          return;
        }

        // First get table names
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const tableNames = Object.keys(data.definitions || {}).filter(
            name => !name.startsWith('rpc/') && name !== 'definitions'
          );
          setTables(tableNames);

          // Then get detailed schema for each table
          const schemas: TableSchema[] = [];
          for (const tableName of tableNames) { // Process all tables
            try {
              // Try to infer schema from a sample row
              const sampleResponse = await fetch(`${supabaseUrl}/rest/v1/${tableName}?limit=1`, {
                headers: {
                  'apikey': supabaseAnonKey,
                  'Authorization': `Bearer ${supabaseAnonKey}`,
                },
              });
              
              if (sampleResponse.ok) {
                const sampleData = await sampleResponse.json();
                if (sampleData.length > 0) {
                  const columns = Object.keys(sampleData[0]).map(colName => ({
                    column_name: colName,
                    data_type: typeof sampleData[0][colName]
                  }));
                  
                  schemas.push({
                    name: tableName,
                    columns: detectForeignKeys(tableName, columns)
                  });
                }
              }
            } catch (err) {
              console.log(`Could not fetch schema for ${tableName}:`, err);
            }
          }
          
          setTableSchemas(schemas);
          setRelationships(findTableRelationships(schemas));
        } else {
          console.log('Could not fetch tables automatically');
          setError('Unable to fetch tables. Tables will need to be configured manually.');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to connect to Supabase');
      } finally {
        setLoading(false);
      }
    };

    fetchTables();
  }, []);

  return { tables, tableSchemas, relationships, loading, error };
};