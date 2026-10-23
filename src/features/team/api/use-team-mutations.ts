import { useMutation, useQueryClient } from "@tanstack/react-query";
import { teamApi } from "@/shared/api";
import { teamQueryKeys } from "./use-team-queries";
import type {
  CreateTeamUserRequest,
  CreateTeamUserResponse,
  UpdateTeamUserStatusRequest,
  ResetTeamUserPasswordResponse,
  UpdateTeamUserStatusResponse,
} from "@/shared/types/api";

export function useCreateTeamUserMutation() {
  const queryClient = useQueryClient();

  return useMutation<CreateTeamUserResponse, Error, CreateTeamUserRequest>({
    mutationFn: (data) => teamApi.createTeamUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.all });
    },
  });
}

export function useUpdateTeamUserStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateTeamUserStatusResponse,
    Error,
    { id: string; data: UpdateTeamUserStatusRequest }
  >({
    mutationFn: ({ id, data }) => teamApi.updateTeamUserStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.users() });
    },
  });
}

export function useResetTeamUserPasswordMutation() {
  const queryClient = useQueryClient();

  return useMutation<ResetTeamUserPasswordResponse, Error, string>({
    mutationFn: (id) => teamApi.resetTeamUserPassword(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.users() });
    },
  });
}

export function useDeleteTeamUserMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => teamApi.deleteTeamUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.all });
    },
  });
}
