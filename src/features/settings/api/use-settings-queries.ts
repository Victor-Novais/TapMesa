import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "@/shared/api";
import { queryKeys } from "@/shared/api/query-client";
import type {
  ServiceSettings,
  UpdateServiceSettingsRequest,
  RestaurantAppearance,
  UpdateAppearanceRequest,
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

export function useAppearanceQuery() {
  return useQuery<RestaurantAppearance>({
    queryKey: queryKeys.settings.appearance,
    queryFn: () => settingsApi.getAppearance(),
    staleTime: 60_000,
  });
}

export function useUpdateAppearanceMutation() {
  const queryClient = useQueryClient();

  return useMutation<RestaurantAppearance, Error, UpdateAppearanceRequest>({
    mutationFn: (data) => settingsApi.updateAppearance(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.settings.appearance, updated);
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.appearance,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.currentRestaurant,
      });
    },
  });
}

export function useResetAppearanceMutation() {
  const queryClient = useQueryClient();

  return useMutation<RestaurantAppearance, Error, void>({
    mutationFn: () => settingsApi.resetAppearance(),
    onSuccess: (resetData) => {
      queryClient.setQueryData(queryKeys.settings.appearance, resetData);
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.appearance,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.currentRestaurant,
      });
    },
  });
}

export function useUploadLogoMutation() {
  const queryClient = useQueryClient();

  return useMutation<RestaurantAppearance, Error, File>({
    mutationFn: (file) => settingsApi.uploadLogo(file),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.settings.appearance, updated);
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.appearance,
      });
    },
  });
}

export function useUploadBackgroundMutation() {
  const queryClient = useQueryClient();

  return useMutation<RestaurantAppearance, Error, File>({
    mutationFn: (file) => settingsApi.uploadBackground(file),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.settings.appearance, updated);
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.appearance,
      });
    },
  });
}
