import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

export type FeedbackCategory = 'bug' | 'feature' | 'general';

export interface SubmitFeedbackParams {
  userId: string;
  category: FeedbackCategory;
  message: string;
}

export async function submitAppFeedback({
  userId,
  category,
  message,
}: SubmitFeedbackParams): Promise<void> {
  const trimmed = message.trim();
  if (!trimmed) {
    throw new Error('Please enter a message before submitting.');
  }

  const { error } = await supabase.from('app_feedback').insert({
    user_id: userId,
    category,
    message: trimmed,
    metadata: {
      platform: Platform.OS,
      os_version: String(Platform.Version),
      app_version: Constants.expoConfig?.version ?? '1.1.0',
    },
  });

  if (error) throw error;
}
