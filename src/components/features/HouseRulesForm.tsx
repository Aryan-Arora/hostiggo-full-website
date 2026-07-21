'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import type { HouseRule, HouseRulesInput } from '@/lib/services/house-rules';
import { Loader2 } from 'lucide-react';

interface HouseRulesFormProps {
  listingId: number;
  onSave?: () => void;
}

const TOGGLES: { key: keyof HouseRulesInput; label: string }[] = [
  { key: 'smoking_allowed', label: 'Smoking allowed' },
  { key: 'pets_allowed', label: 'Pets allowed' },
  { key: 'parties_allowed', label: 'Parties or events allowed' },
  { key: 'quiet_hours', label: 'Quiet hours enforced (10 PM – 8 AM)' },
];

export default function HouseRulesForm({ listingId, onSave }: HouseRulesFormProps) {
  const { userId } = useAuth();
  const [rules, setRules] = useState<HouseRulesInput>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, [listingId]);

  const load = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/host/listings/${listingId}/house-rules`);
      if (!response.ok) throw new Error('Failed to load house rules');
      const { data } = (await response.json()) as { data: HouseRule | null };
      if (data) {
        setRules({
          check_in_time: data.check_in_time,
          check_out_time: data.check_out_time,
          smoking_allowed: data.smoking_allowed,
          pets_allowed: data.pets_allowed,
          parties_allowed: data.parties_allowed,
          quiet_hours: data.quiet_hours,
        });
      }
    } catch (error) {
      console.error('Failed to load house rules:', error);
      toast.error('Failed to load house rules');
    } finally {
      setLoading(false);
    }
  };

  const save = async (patch: HouseRulesInput) => {
    const next = { ...rules, ...patch };
    setRules(next);
    try {
      setSaving(true);
      const response = await fetch(`/api/host/listings/${listingId}/house-rules`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...next, userId }),
      });
      if (!response.ok) throw new Error('Failed to save house rules');
      onSave?.();
    } catch (error) {
      console.error('Failed to save house rules:', error);
      toast.error('Failed to save house rules');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Set House Rules</h3>
        <p className="text-sm text-gray-600">
          Clear rules help avoid misunderstandings with guests
        </p>
      </div>

      <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-1">Check-in time</label>
        <input
          type="time"
          value={rules.check_in_time ?? ''}
          onChange={(e) => save({ check_in_time: e.target.value })}
          disabled={saving}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        />
        <label className="block text-sm font-medium text-gray-700 mb-1 mt-3">Check-out time</label>
        <input
          type="time"
          value={rules.check_out_time ?? ''}
          onChange={(e) => save({ check_out_time: e.target.value })}
          disabled={saving}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        />
      </div>

      <div className="space-y-2">
        {TOGGLES.map((t) => (
          <button
            key={t.key}
            onClick={() => save({ [t.key]: !rules[t.key] })}
            disabled={saving}
            className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors text-left disabled:opacity-50"
          >
            <span className="text-sm text-gray-800">{t.label}</span>
            <span
              className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                rules[t.key] ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'
              }`}
            >
              {rules[t.key] && (
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
