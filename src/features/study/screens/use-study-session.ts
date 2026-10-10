import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { BackHandler } from "react-native";

import { gradeLabel, intervalLabel, schedule, type Grade } from "@/domain/schedule";
import { answerSession, skipCurrent, startSession, type SessionState } from "@/domain/session";
import { useCard } from "@/features/cards";
import { useProfile, useUpdateProfile } from "@/features/profile";

import type { StudyCard } from "../interfaces";
import { useAnswerCard } from "../usecases/use-answer-card";

const SAVE_ERROR = "Não foi possível salvar a resposta. Tente de novo.";

const grades: Grade[] = [0, 1, 2, 3];

export type SessionAction =
  | { type: "answer"; updated: StudyCard; grade: Grade; now: Date }
  | { type: "skip" };

export function sessionReducer(
  state: SessionState<StudyCard>,
  action: SessionAction,
): SessionState<StudyCard> {
  return action.type === "answer"
    ? answerSession(state, action.updated, action.grade, action.now)
    : skipCurrent(state);
}

export type AnswerOption = { grade: Grade; name: string; interval: string };

export function useStudySession(cards: StudyCard[]) {
  // The queue is a snapshot: started once from the first read (QUE-02).
  const [state, dispatch] = useReducer(sessionReducer, cards, (initial) => startSession(initial, new Date()));
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const card = state.queue[0];
  const position = state.completed + 1;
  const revealed = card !== undefined && revealedId === card.id;
  const reveal = useCallback(() => setRevealedId(card?.id ?? null), [card?.id]);
  const mutation = useAnswerCard();
  const busy = useRef(false);
  const [error, setError] = useState(false);
  // QUE-05: a card deleted during the session is skipped without an answer.
  const { data: stored } = useCard(card?.id ?? "");
  useEffect(() => {
    if (card && stored === null) {
      dispatch({ type: "skip" });
    }
  }, [card, stored]);

  // ONB-01..03: the sheet shows once, until the profile flag is saved.
  const { data: profile, isPending: profilePending } = useProfile();
  const { mutate: saveProfile } = useUpdateProfile();
  const [tutorialDismissed, setTutorialDismissed] = useState(false);
  const tutorialOpen =
    card !== undefined && !tutorialDismissed && profile != null && !profile.studyTutorialSeen;
  const dismissTutorial = useCallback(() => {
    // ONB-05: the sheet closes even if saving the flag fails.
    setTutorialDismissed(true);
    saveProfile({ studyTutorialSeen: true });
  }, [saveProfile]);

  const [exitOpen, setExitOpen] = useState(false);
  const requestExit = useCallback(() => setExitOpen(true), []);
  const cancelExit = useCallback(() => setExitOpen(false), []);
  const leave = useCallback(() => {
    setExitOpen(false);
    router.back();
  }, []);

  // EXT-03: the Android back button asks for confirmation, only while studying.
  // ONB-06: with the sheet open, back closes the sheet instead.
  const listening = card !== undefined && !profilePending && !tutorialOpen;
  useEffect(() => {
    if (!listening) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      setExitOpen(true);
      return true;
    });
    return () => subscription.remove();
  }, [listening]);

  const answer = useCallback(
    (grade: Grade) => {
      if (busy.current || !card) return;
      busy.current = true;
      setError(false);
      mutation.mutate(
        { cardId: card.id, grade },
        {
          onSuccess: (updated) => {
            dispatch({ type: "answer", updated, grade, now: new Date() });
            setRevealedId(null);
          },
          onError: () => setError(true),
          onSettled: () => {
            busy.current = false;
          },
        },
      );
    },
    [card, mutation],
  );

  const answers = useMemo<AnswerOption[]>(() => {
    if (!card) return [];
    const now = new Date();
    return grades.map((g) => ({
      grade: g,
      name: gradeLabel[g],
      interval: intervalLabel(schedule(card, g, now).intervalDays),
    }));
  }, [card]);

  return {
    state,
    card,
    position,
    revealed,
    answers,
    error: error ? SAVE_ERROR : undefined,
    pending: mutation.isPending,
    reveal,
    answer,
    tutorialOpen,
    dismissTutorial,
    exitOpen,
    requestExit,
    cancelExit,
    leave,
  };
}
