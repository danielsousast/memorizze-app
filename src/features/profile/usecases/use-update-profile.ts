import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { AppError } from "@/domain/errors";

import type { Profile, ProfileErrorCode, ProfileInput } from "../interfaces";
import { useProfileRepository } from "../repository";
import { profileKeys } from "./keys";

export function useUpdateProfile() {
  const repository = useProfileRepository();
  const queryClient = useQueryClient();
  return useMutation<Profile, AppError<ProfileErrorCode>, ProfileInput>({
    mutationFn: async (input) => repository.update(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKeys.all }),
  });
}
