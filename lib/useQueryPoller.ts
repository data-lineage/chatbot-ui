'use client';

import { useQuery } from '@tanstack/react-query';
import { pollStatus } from './api';

export function useQueryPoller(enabled: boolean) {
  return useQuery({
    queryKey: ['queryStatus'],
    queryFn: pollStatus,
    enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return !status || status === 'processing' ? 1500 : false;
    },
  });
}
