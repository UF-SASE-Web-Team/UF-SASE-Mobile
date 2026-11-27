import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { draftFromEvent, emptyEventDraft, moveStart, validateEventDraft } from '@/lib/eventDraft';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { deleteEvent, saveEvent, uploadEventFlyer } from '@/services/admin';
import { getEvent, getEventCheckinCode } from '@/services/events';
import type { EventDraft } from '@/types/admin';

type PendingFlyer = { uri: string; width: number };

/**
 * Loads, edits, saves and deletes one event. `eventId` undefined means a new
 * event. A picked flyer uploads only when the event is saved.
 */
export function useEventEditor(eventId: string | undefined) {
  const isNew = !eventId;
  const [draft, setDraft] = useState<EventDraft | null>(isNew ? emptyEventDraft() : null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [pendingFlyer, setPendingFlyer] = useState<PendingFlyer | null>(null);
  const [busy, setBusy] = useState<'save' | 'delete' | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    let active = true;
    Promise.all([getEvent(eventId), getEventCheckinCode(eventId)])
      .then(([event, checkinCode]) => {
        if (!active) return;
        if (event) setDraft(draftFromEvent(event, checkinCode ?? ''));
        else setLoadError('Event not found.');
      })
      .catch((cause) => {
        if (active) setLoadError(getFriendlyErrorMessage(cause, 'Could not load this event.'));
      });
    return () => {
      active = false;
    };
  }, [eventId]);

  const change = <K extends keyof EventDraft>(key: K, value: EventDraft[K]) => {
    setDraft((current) => {
      if (!current) return current;
      return key === 'startsAt' ? moveStart(current, value as Date) : { ...current, [key]: value };
    });
    setErrors((current) => ({ ...current, [key]: undefined }));
    setSaveError(null);
  };

  const pickFlyer = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photos access needed', 'Allow photo access in Settings to upload a flyer.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    const asset = result.canceled ? null : result.assets[0];
    if (asset) setPendingFlyer({ uri: asset.uri, width: asset.width });
  };

  const removeFlyer = () => {
    setPendingFlyer(null);
    change('flyerUrl', null);
  };

  /** Saves the event (and flyer). Returns the event ID, or null if it wasn't saved. */
  const save = async (): Promise<string | null> => {
    if (!draft || busy) return null;
    const problems = validateEventDraft(draft);
    setErrors(problems);
    if (Object.keys(problems).length > 0) {
      setSaveError('Fix the highlighted fields.');
      return null;
    }
    setBusy('save');
    setSaveError(null);
    try {
      const id = await saveEvent(draft, eventId);
      if (pendingFlyer) {
        const flyerUrl = await uploadEventFlyer(id, pendingFlyer);
        setPendingFlyer(null);
        setDraft((current) => (current ? { ...current, flyerUrl } : current));
      }
      return id;
    } catch (cause) {
      setSaveError(getFriendlyErrorMessage(cause, 'Could not save this event.'));
      return null;
    } finally {
      setBusy(null);
    }
  };

  /** Deletes the event. Resolves true once it's gone. */
  const remove = async (): Promise<boolean> => {
    if (!eventId || busy) return false;
    setBusy('delete');
    setSaveError(null);
    try {
      await deleteEvent(eventId);
      return true;
    } catch (cause) {
      setSaveError(getFriendlyErrorMessage(cause, 'Could not delete this event.'));
      return false;
    } finally {
      setBusy(null);
    }
  };

  return {
    isNew,
    draft,
    loadError,
    errors,
    change,
    pendingFlyerUri: pendingFlyer?.uri ?? null,
    pickFlyer,
    removeFlyer,
    busy,
    saveError,
    save,
    remove,
  };
}
