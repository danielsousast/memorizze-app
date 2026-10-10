import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { AppError } from "@/domain/errors";

import type { Profile, ProfileErrorCode } from "../interfaces";
import { useProfileRepository } from "../repository";
import { profileKeys } from "./keys";

export function useCreateProfile() {
  const repository = useProfileRepository();
  const queryClient = useQueryClient();
  return useMutation<Profile, AppError<ProfileErrorCode>, string>({
    mutationFn: async (name) => repository.create(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKeys.all }),
  });
}
