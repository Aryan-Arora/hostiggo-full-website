import { useState, useCallback } from 'react';
import * as safetyDetailsApi from '@/lib/api/safety-details';

export function useSafetyDetails(listingId: number) {
  const [features, setFeatures] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSafetyDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await safetyDetailsApi.getSafetyDetails(listingId);
      setFeatures(data.available || []);
      setSelected(data.selected || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load safety details';
      setError(message);
      console.error('[useSafetyDetails] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  const addFeature = useCallback(
    async (featureId: number) => {
      setSaving(true);
      setError(null);
      try {
        const detail = await safetyDetailsApi.addSafetyFeature(listingId, featureId);
        setSelected((prev) => [...prev, detail]);
        return detail;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add safety feature';
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [listingId]
  );

  const toggleFeature = useCallback(
    async (detailId: number, enabled: boolean) => {
      setSaving(true);
      setError(null);
      try {
        const updated = await safetyDetailsApi.toggleSafetyFeature(listingId, detailId, enabled);
        setSelected((prev) =>
          prev.map((s: any) => (s.id === detailId ? updated : s))
        );
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to toggle safety feature';
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [listingId]
  );

  const removeFeature = useCallback(
    async (detailId: number) => {
      setSaving(true);
      setError(null);
      try {
        await safetyDetailsApi.removeSafetyFeature(listingId, detailId);
        setSelected((prev) => prev.filter((s: any) => s.id !== detailId));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to remove safety feature';
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [listingId]
  );

  return {
    features,
    selected,
    loading,
    saving,
    error,
    loadSafetyDetails,
    addFeature,
    toggleFeature,
    removeFeature,
  };
}
