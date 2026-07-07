/**
 * API client for safety details
 */

export async function getSafetyDetails(listingId: number) {
  const response = await fetch(`/api/host/listings/${listingId}/safety-details`);
  if (!response.ok) throw new Error('Failed to fetch safety details');
  const data = await response.json();
  return data.data;
}

export async function getAvailableSafetyFeatures() {
  const response = await fetch('/api/safety-features');
  if (!response.ok) throw new Error('Failed to fetch safety features');
  const data = await response.json();
  return data.data || [];
}

export async function addSafetyFeature(listingId: number, featureId: number) {
  const response = await fetch(`/api/host/listings/${listingId}/safety-details`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feature_id: featureId }),
  });
  if (!response.ok) throw new Error('Failed to add safety feature');
  const data = await response.json();
  return data.data;
}

export async function toggleSafetyFeature(listingId: number, detailId: number, enabled: boolean) {
  const response = await fetch(`/api/host/listings/${listingId}/safety-details/${detailId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  });
  if (!response.ok) throw new Error('Failed to toggle safety feature');
  const data = await response.json();
  return data.data;
}

export async function removeSafetyFeature(listingId: number, detailId: number) {
  const response = await fetch(`/api/host/listings/${listingId}/safety-details/${detailId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to remove safety feature');
  return true;
}
