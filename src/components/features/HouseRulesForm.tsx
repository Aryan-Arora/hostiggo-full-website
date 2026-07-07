'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { HouseRule } from '@/lib/services/house-rules';
import { Loader2, Plus, Trash2, Edit2 } from 'lucide-react';

interface HouseRulesFormProps {
  listingId: number;
  onSave?: () => void;
}

const COMMON_RULES = [
  'No smoking',
  'No pets',
  'No loud noise after 10 PM',
  'No parties or gatherings',
  'No unregistered guests',
  'Check-in after 2 PM, Check-out before 11 AM',
  'Guests must be 18+',
  'No short-term rentals',
];

export default function HouseRulesForm({ listingId, onSave }: HouseRulesFormProps) {
  const [rules, setRules] = useState<HouseRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newRule, setNewRule] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  // Load rules on mount
  useEffect(() => {
    loadRules();
  }, [listingId]);

  const loadRules = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/host/listings/${listingId}/house-rules`);
      if (!response.ok) throw new Error('Failed to load house rules');
      const data = await response.json();
      setRules(data.data || []);
    } catch (error) {
      console.error('Failed to load house rules:', error);
      toast.error('Failed to load house rules');
    } finally {
      setLoading(false);
    }
  };

  const addRule = async () => {
    if (!newRule.trim()) {
      toast.error('Please enter a rule');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/host/listings/${listingId}/house-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule: newRule.trim() }),
      });

      if (!response.ok) throw new Error('Failed to add rule');
      toast.success('Rule added successfully');
      setNewRule('');
      await loadRules();
      onSave?.();
    } catch (error) {
      console.error('Failed to add rule:', error);
      toast.error('Failed to add rule');
    } finally {
      setSaving(false);
    }
  };

  const updateRule = async (id: number, updatedRule: string) => {
    if (!updatedRule.trim()) {
      toast.error('Please enter a rule');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/host/listings/${listingId}/house-rules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule: updatedRule.trim() }),
      });

      if (!response.ok) throw new Error('Failed to update rule');
      toast.success('Rule updated successfully');
      setEditingId(null);
      setEditingValue('');
      await loadRules();
      onSave?.();
    } catch (error) {
      console.error('Failed to update rule:', error);
      toast.error('Failed to update rule');
    } finally {
      setSaving(false);
    }
  };

  const deleteRule = async (id: number) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/host/listings/${listingId}/house-rules/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete rule');
      toast.success('Rule removed');
      await loadRules();
      onSave?.();
    } catch (error) {
      console.error('Failed to delete rule:', error);
      toast.error('Failed to remove rule');
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Set House Rules
        </h3>
        <p className="text-sm text-gray-600">
          Clear rules help avoid misunderstandings with guests
        </p>
      </div>

      {/* Quick add buttons */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Quick add common rules:</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {COMMON_RULES.map((rule) => (
            <button
              key={rule}
              onClick={() => setNewRule(rule)}
              className="text-left px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-blue-50 hover:border-blue-200 transition-colors"
            >
              {rule}
            </button>
          ))}
        </div>
      </div>

      {/* Add new rule */}
      <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add a rule
          </label>
          <div className="flex gap-2">
            <textarea
              placeholder="e.g., No smoking inside the property"
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              rows={2}
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm resize-none"
            />
            <button
              onClick={addRule}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 h-fit"
            >
              {saving ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add
            </button>
          </div>
        </div>
      </div>

      {/* List of rules */}
      <div className="space-y-3">
        {rules.length > 0 ? (
          <div className="space-y-2">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg bg-white"
              >
                <div className="flex-1 min-w-0">
                  {editingId === rule.id ? (
                    <textarea
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm resize-none"
                      rows={2}
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{rule.rule}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {editingId === rule.id ? (
                    <>
                      <button
                        onClick={() => updateRule(rule.id, editingValue)}
                        disabled={saving}
                        className="px-3 py-1 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700 disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 border border-gray-300 text-gray-600 rounded text-xs font-semibold hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingId(rule.id);
                          setEditingValue(rule.rule);
                        }}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        disabled={saving}
                        className="p-1.5 hover:bg-red-50 rounded transition-colors text-red-600 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-gray-500 py-4">
            No rules added yet. Add some to help guests understand expectations.
          </p>
        )}
      </div>
    </div>
  );
}
