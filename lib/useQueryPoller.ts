'use client';

import { useQuery } from '@tanstack/react-query';
import { pollStatus } from './api';

export function useQueryPoller(enabled: boolean, queryId?: string) {
  return useQuery({
    queryKey: ['queryStatus', queryId || 'default'],
    queryFn: pollStatus,
    enabled: enabled && (queryId !== undefined ? Boolean(queryId) : true),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return !status || status === 'processing' ? 3500 : false;
    },
    gcTime: 0,
    staleTime: 0,
  });
}
