import { useState, useCallback } from 'react';
import * as houseRulesApi from '@/lib/api/house-rules';

export function useHouseRules(listingId: number) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await houseRulesApi.getHouseRules(listingId);
      setRules(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load house rules';
      setError(message);
      console.error('[useHouseRules] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  const addRule = useCallback(
    async (rule: string) => {
      setSaving(true);
      setError(null);
      try {
        const newRule = await houseRulesApi.createHouseRule(listingId, rule);
        setRules((prev) => [...prev, newRule]);
        return newRule;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add rule';
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [listingId]
  );

  const updateRule = useCallback(
    async (ruleId: number, rule: string) => {
      setSaving(true);
      setError(null);
      try {
        const updated = await houseRulesApi.updateHouseRule(listingId, ruleId, rule);
        setRules((prev) => prev.map((r: any) => (r.id === ruleId ? updated : r)));
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update rule';
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [listingId]
  );

  const deleteRule = useCallback(
    async (ruleId: number) => {
      setSaving(true);
      setError(null);
      try {
        await houseRulesApi.deleteHouseRule(listingId, ruleId);
        setRules((prev) => prev.filter((r: any) => r.id !== ruleId));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete rule';
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [listingId]
  );

  return {
    rules,
    loading,
    saving,
    error,
    loadRules,
    addRule,
    updateRule,
    deleteRule,
  };
}
