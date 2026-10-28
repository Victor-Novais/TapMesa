import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminRestaurantSettingsApi } from "@/shared/api";
import { queryKeys } from "@/shared/api/query-client";
import type {
  ServiceSettings,
  UpdateServiceSettingsRequest,
  RestaurantAppearance,
  UpdateAppearanceRequest,
  NotificationSettingsDto,
  UpdateNotificationSettingsRequest,
  SendDailySummaryResponse,
} from "@/shared/types/api";

const keys = queryKeys.admin.restaurantSettings;

export function useServiceSettingsQuery(restaurantId: string) {
  return useQuery<ServiceSettings>({
    queryKey: keys.service(restaurantId),
    queryFn: () => adminRestaurantSettingsApi.getServiceSettings(restaurantId),
    staleTime: 60_000,
  });
}

export function useUpdateServiceSettingsMutation(restaurantId: string) {
  const queryClient = useQueryClient();

  return useMutation<ServiceSettings, Error, UpdateServiceSettingsRequest>({
    mutationFn: (data) =>
      adminRestaurantSettingsApi.updateServiceSettings(restaurantId, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(keys.service(restaurantId), updated);
    },
  });
}

export function useAppearanceQuery(restaurantId: string) {
  return useQuery<RestaurantAppearance>({
    queryKey: keys.appearance(restaurantId),
    queryFn: () => adminRestaurantSettingsApi.getAppearance(restaurantId),
    staleTime: 60_000,
  });
}

// A resposta do servidor é a fonte da verdade: substitui o cache sem novo GET
function useAppearanceMutation<TVariables>(
  restaurantId: string,
  mutationFn: (variables: TVariables) => Promise<RestaurantAppearance>,
) {
  const queryClient = useQueryClient();

  return useMutation<RestaurantAppearance, Error, TVariables>({
    mutationFn,
    onSuccess: (updated) => {
      queryClient.setQueryData(keys.appearance(restaurantId), updated);
    },
  });
}

export function useUpdateAppearanceMutation(restaurantId: string) {
  return useAppearanceMutation<UpdateAppearanceRequest>(restaurantId, (data) =>
    adminRestaurantSettingsApi.updateAppearance(restaurantId, data),
  );
}

export function useResetAppearanceMutation(restaurantId: string) {
  return useAppearanceMutation<void>(restaurantId, () =>
    adminRestaurantSettingsApi.resetAppearance(restaurantId),
  );
}

export function useUploadLogoMutation(restaurantId: string) {
  return useAppearanceMutation<File>(restaurantId, (file) =>
    adminRestaurantSettingsApi.uploadLogo(restaurantId, file),
  );
}

export function useUploadBackgroundMutation(restaurantId: string) {
  return useAppearanceMutation<File>(restaurantId, (file) =>
    adminRestaurantSettingsApi.uploadBackground(restaurantId, file),
  );
}

export function useNotificationSettingsQuery(restaurantId: string) {
  return useQuery<NotificationSettingsDto>({
    queryKey: keys.notifications(restaurantId),
    queryFn: () =>
      adminRestaurantSettingsApi.getNotificationSettings(restaurantId),
    staleTime: 60_000,
  });
}

export function useUpdateNotificationSettingsMutation(restaurantId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    NotificationSettingsDto,
    Error,
    UpdateNotificationSettingsRequest
  >({
    mutationFn: (data) =>
      adminRestaurantSettingsApi.updateNotificationSettings(restaurantId, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(keys.notifications(restaurantId), updated);
    },
  });
}

export function useSendDailySummaryTestMutation(restaurantId: string) {
  return useMutation<SendDailySummaryResponse, Error, void>({
    mutationFn: () =>
      adminRestaurantSettingsApi.sendDailySummaryTest(restaurantId),
  });
}
