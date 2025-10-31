import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/db';

export interface OnboardingState {
  id?: string;
  userId: string;
  completed: boolean;
  currentStep: number;
  totalSteps: number;
  skipped: boolean;
  completedAt?: string;
  lastSeenStep: number;
}

interface UseOnboardingReturn {
  onboarding: OnboardingState | null;
  isLoading: boolean;
  error: string | null;
  startOnboarding: () => Promise<void>;
  nextStep: () => Promise<void>;
  previousStep: () => Promise<void>;
  skipOnboarding: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  restartOnboarding: () => Promise<void>;
  goToStep: (step: number) => Promise<void>;
  shouldShowOnboarding: boolean;
}

const TOTAL_STEPS = 11;

export function useOnboarding(userId: string | null): UseOnboardingReturn {
  const [onboarding, setOnboarding] = useState<OnboardingState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOnboarding = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        setOnboarding({
          id: data.id,
          userId: data.user_id,
          completed: data.completed,
          currentStep: data.current_step,
          totalSteps: data.total_steps,
          skipped: data.skipped,
          completedAt: data.completed_at,
          lastSeenStep: data.last_seen_step,
        });
      } else {
        setOnboarding(null);
      }
    } catch (err) {
      console.error('Failed to load onboarding:', err);
      setError(err instanceof Error ? err.message : 'Failed to load onboarding');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadOnboarding();
  }, [loadOnboarding]);

  const startOnboarding = useCallback(async () => {
    if (!userId) return;

    try {
      setError(null);

      const newOnboarding = {
        user_id: userId,
        completed: false,
        current_step: 0,
        total_steps: TOTAL_STEPS,
        skipped: false,
        last_seen_step: 0,
      };

      const { data, error: insertError } = await supabase
        .from('user_onboarding')
        .insert(newOnboarding)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      if (data) {
        setOnboarding({
          id: data.id,
          userId: data.user_id,
          completed: data.completed,
          currentStep: data.current_step,
          totalSteps: data.total_steps,
          skipped: data.skipped,
          completedAt: data.completed_at,
          lastSeenStep: data.last_seen_step,
        });
      }
    } catch (err) {
      console.error('Failed to start onboarding:', err);
      setError(err instanceof Error ? err.message : 'Failed to start onboarding');
    }
  }, [userId]);

  const updateOnboarding = useCallback(async (updates: Partial<OnboardingState>) => {
    if (!userId || !onboarding?.id) return;

    try {
      setError(null);

      const dbUpdates: any = {};
      if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
      if (updates.currentStep !== undefined) dbUpdates.current_step = updates.currentStep;
      if (updates.skipped !== undefined) dbUpdates.skipped = updates.skipped;
      if (updates.lastSeenStep !== undefined) dbUpdates.last_seen_step = updates.lastSeenStep;
      if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;

      const { data, error: updateError } = await supabase
        .from('user_onboarding')
        .update(dbUpdates)
        .eq('id', onboarding.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      if (data) {
        setOnboarding({
          id: data.id,
          userId: data.user_id,
          completed: data.completed,
          currentStep: data.current_step,
          totalSteps: data.total_steps,
          skipped: data.skipped,
          completedAt: data.completed_at,
          lastSeenStep: data.last_seen_step,
        });
      }
    } catch (err) {
      console.error('Failed to update onboarding:', err);
      setError(err instanceof Error ? err.message : 'Failed to update onboarding');
    }
  }, [userId, onboarding?.id]);

  const nextStep = useCallback(async () => {
    if (!onboarding) return;

    const newStep = Math.min(onboarding.currentStep + 1, TOTAL_STEPS - 1);
    await updateOnboarding({
      currentStep: newStep,
      lastSeenStep: Math.max(onboarding.lastSeenStep, newStep),
    });
  }, [onboarding, updateOnboarding]);

  const previousStep = useCallback(async () => {
    if (!onboarding) return;

    const newStep = Math.max(onboarding.currentStep - 1, 0);
    await updateOnboarding({
      currentStep: newStep,
    });
  }, [onboarding, updateOnboarding]);

  const goToStep = useCallback(async (step: number) => {
    if (!onboarding) return;

    const validStep = Math.max(0, Math.min(step, TOTAL_STEPS - 1));
    await updateOnboarding({
      currentStep: validStep,
      lastSeenStep: Math.max(onboarding.lastSeenStep, validStep),
    });
  }, [onboarding, updateOnboarding]);

  const skipOnboarding = useCallback(async () => {
    if (!onboarding) return;

    await updateOnboarding({
      skipped: true,
      completed: true,
      completedAt: new Date().toISOString(),
    });
  }, [onboarding, updateOnboarding]);

  const completeOnboarding = useCallback(async () => {
    if (!onboarding) return;

    await updateOnboarding({
      completed: true,
      completedAt: new Date().toISOString(),
      currentStep: TOTAL_STEPS - 1,
    });
  }, [onboarding, updateOnboarding]);

  const restartOnboarding = useCallback(async () => {
    if (!userId) return;

    try {
      setError(null);

      if (onboarding?.id) {
        const { data, error: updateError } = await supabase
          .from('user_onboarding')
          .update({
            completed: false,
            current_step: 0,
            skipped: false,
            last_seen_step: 0,
            completed_at: null,
          })
          .eq('id', onboarding.id)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        if (data) {
          setOnboarding({
            id: data.id,
            userId: data.user_id,
            completed: data.completed,
            currentStep: data.current_step,
            totalSteps: data.total_steps,
            skipped: data.skipped,
            completedAt: data.completed_at,
            lastSeenStep: data.last_seen_step,
          });
        }
      } else {
        const newOnboarding = {
          user_id: userId,
          completed: false,
          current_step: 0,
          total_steps: TOTAL_STEPS,
          skipped: false,
          last_seen_step: 0,
        };

        const { data, error: insertError } = await supabase
          .from('user_onboarding')
          .insert(newOnboarding)
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        if (data) {
          setOnboarding({
            id: data.id,
            userId: data.user_id,
            completed: data.completed,
            currentStep: data.current_step,
            totalSteps: data.total_steps,
            skipped: data.skipped,
            completedAt: data.completed_at,
            lastSeenStep: data.last_seen_step,
          });
        }
      }
    } catch (err) {
      console.error('Failed to restart onboarding:', err);
      setError(err instanceof Error ? err.message : 'Failed to restart onboarding');
      throw err;
    }
  }, [userId, onboarding?.id]);

  const shouldShowOnboarding = !isLoading &&
    (!onboarding || (!onboarding.completed && !onboarding.skipped));

  return {
    onboarding,
    isLoading,
    error,
    startOnboarding,
    nextStep,
    previousStep,
    skipOnboarding,
    completeOnboarding,
    restartOnboarding,
    goToStep,
    shouldShowOnboarding,
  };
}
