import { useState, useEffect } from 'react';
import { supabase } from '../utils/db';

export function useDatabaseStatus() {
  const [status, setStatus] = useState<'connected' | 'connecting' | 'error'>('connecting');

  useEffect(() => {
    let mounted = true;
    let retryTimeout: number;

    const checkConnection = async () => {
      try {
        setStatus('connecting');
        const { data, error } = await supabase
          .from('fishing_sessions')
          .select('id')
          .limit(1)
          .throwOnError();

        if (mounted) {
          setStatus(error || !Array.isArray(data) ? 'error' : 'connected');
        }
      } catch {
        if (mounted) {
          setStatus('error');
        }
      }

      if (mounted) {
        retryTimeout = window.setTimeout(checkConnection, 30000);
      }
    };

    checkConnection();

    return () => {
      mounted = false;
      clearTimeout(retryTimeout);
    };
  }, []);

  return status;
}