'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { SafetyFeature, ListingSafetyDetail } from '@/lib/services/safety-details';
import { Loader2, Check } from 'lucide-react';

interface SafetyDetailsFormProps {
  listingId: number;
  onSave?: () => void;
}

// Icon mapping for safety features - can be replaced with actual icons
const SAFETY_ICONS: Record<string, string> = {
  'exterior_security_camera': '📹',
  'noise_level_monitoring_device': '🔊',
  'weapon_on_property': '🔫',
  'smoke_alarm': '🚨',
  'first_aid_kit': '🩹',
  'fire_extinguisher': '🧯',
  'emergency_contacts': '📞',
  'cctv': '📷',
  'lock': '🔒',
};

export default function SafetyDetailsForm({ listingId, onSave }: SafetyDetailsFormProps) {
  const { userId } = useAuth();
  const [allFeatures, setAllFeatures] = useState<SafetyFeature[]>([]);
  const [selectedDetails, setSelectedDetails] = useState<ListingSafetyDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load safety details on mount
  useEffect(() => {
    loadSafetyDetails();
  }, [listingId]);

  const loadSafetyDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/host/listings/${listingId}/safety-details`);
      if (!response.ok) throw new Error('Failed to load safety details');
      const data = await response.json();
      setAllFeatures(data.data.available || []);
      setSelectedDetails(data.data.selected || []);
    } catch (error) {
      console.error('Failed to load safety details:', error);
      toast.error('Failed to load safety details');
    } finally {
      setLoading(false);
    }
  };

  const isFeatureSelected = (featureId: number): boolean => {
    return selectedDetails.some((detail) => detail.feature_id === featureId);
  };

  const addSafetyFeature = async (featureId: number) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/host/listings/${listingId}/safety-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature_id: featureId, userId }),
      });

      if (!response.ok) throw new Error('Failed to add safety feature');
      toast.success('Safety feature added');
      await loadSafetyDetails();
      onSave?.();
    } catch (error) {
      console.error('Failed to add safety feature:', error);
      toast.error('Failed to add safety feature');
    } finally {
      setSaving(false);
    }
  };

  const removeSafetyFeature = async (detailId: number) => {
    try {
      setSaving(true);
      const response = await fetch(
        `/api/host/listings/${listingId}/safety-details/${detailId}?userId=${encodeURIComponent(userId ?? '')}`,
        { method: 'DELETE' },
      );

      if (!response.ok) throw new Error('Failed to remove safety feature');
      toast.success('Safety feature removed');
      await loadSafetyDetails();
      onSave?.();
    } catch (error) {
      console.error('Failed to remove safety feature:', error);
      toast.error('Failed to remove safety feature');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-figma-navy" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Safety Details
        </h3>
        <p className="text-sm text-gray-600">
          Guests value transparency. Safety details help build trust
        </p>
      </div>

      <div className="space-y-3">
        {allFeatures.length > 0 ? (
          allFeatures.map((feature) => {
            const selected = selectedDetails.find((d) => d.feature_id === feature.feature_id);
            const iconEmoji = SAFETY_ICONS[feature.name?.toLowerCase().replace(/\s+/g, '_')] || '✓';

            return (
              <div
                key={feature.feature_id}
                className="p-4 border border-gray-200 rounded-lg bg-white hover:border-figma-navy/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() =>
                      selected
                        ? removeSafetyFeature(selected.id)
                        : addSafetyFeature(feature.feature_id)
                    }
                    disabled={saving}
                    className="flex-shrink-0 mt-0.5"
                  >
                    <div
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                        selected
                          ? 'bg-figma-navy border-figma-navy'
                          : 'border-gray-300 hover:border-figma-navy/60'
                      }`}
                    >
                      {selected && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{iconEmoji}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{feature.name}</h4>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-sm text-gray-500 py-8">
            No safety features available. They will be added by administrators.
          </p>
        )}
      </div>

      {selectedDetails.length > 0 && (
        <div className="p-4 bg-figma-navy/5 rounded-lg border border-figma-navy/30">
          <p className="text-sm text-figma-navy font-semibold mb-2">
            Selected Safety Features ({selectedDetails.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedDetails.map((detail) => {
              const feature = allFeatures.find((f) => f.feature_id === detail.feature_id);
              return feature ? (
                <span
                  key={detail.id}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-figma-navy/10 text-figma-navy rounded-full text-sm font-medium"
                >
                  ✓ {feature.name}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
