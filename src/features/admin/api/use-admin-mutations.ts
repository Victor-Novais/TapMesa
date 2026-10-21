import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/shared/api";
import type {
  CreateRestaurantRequest,
  CreateRestaurantResponse,
  ResetOwnerPasswordResponse,
  ImpersonateResponse,
} from "@/shared/types/api";

export function useCreateAdminRestaurantMutation() {
  const queryClient = useQueryClient();

  return useMutation<CreateRestaurantResponse, Error, CreateRestaurantRequest>({
    mutationFn: (data) => adminApi.createAdminRestaurant(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "restaurants"] });
    },
  });
}

export function useSuspendAdminRestaurantMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => adminApi.suspendAdminRestaurant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "restaurants"] });
    },
  });
}

export function useReactivateAdminRestaurantMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => adminApi.reactivateAdminRestaurant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "restaurants"] });
    },
  });
}

export function useResetAdminOwnerPasswordMutation() {
  return useMutation<ResetOwnerPasswordResponse, Error, string>({
    mutationFn: (id) => adminApi.resetAdminOwnerPassword(id),
  });
}

export function useImpersonateRestaurantMutation() {
  return useMutation<ImpersonateResponse, Error, string>({
    mutationFn: (id) => adminApi.impersonateRestaurant(id),
  });
}

export function useDeleteAdminRestaurantMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: string; confirmName: string }>({
    mutationFn: ({ id, confirmName }) =>
      adminApi.deleteAdminRestaurant(id, confirmName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "restaurants"] });
    },
  });
}
