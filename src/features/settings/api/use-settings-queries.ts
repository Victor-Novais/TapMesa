import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "@/shared/api";
import { queryKeys } from "@/shared/api/query-client";
import type {
  ServiceSettings,
  UpdateServiceSettingsRequest,
} from "@/shared/types/api";

export function useServiceSettingsQuery() {
  return useQuery<ServiceSettings>({
    queryKey: queryKeys.settings.service,
    queryFn: () => settingsApi.getServiceSettings(),
    staleTime: 60_000,
  });
}

export function useUpdateServiceSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation<ServiceSettings, Error, UpdateServiceSettingsRequest>({
    mutationFn: (data) => settingsApi.updateServiceSettings(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.settings.service, updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.service });
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.currentRestaurant,
      });
    },
  });
}
