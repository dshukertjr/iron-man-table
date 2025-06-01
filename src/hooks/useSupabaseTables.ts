import { useEffect, useState } from 'react';

export const useSupabaseTables = () => {
  const [tables, setTables] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        // Use Supabase REST API to get schema information
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          // The root endpoint returns available resources which are the table names
          const tableNames = Object.keys(data.definitions || {}).filter(
            name => !name.startsWith('rpc/') && name !== 'definitions'
          );
          setTables(tableNames);
        } else {
          // If the above doesn't work, we'll show a message
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

  return { tables, loading, error };
};