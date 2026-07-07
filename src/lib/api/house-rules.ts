/**
 * API client for house rules
 */

export async function getHouseRules(listingId: number) {
  const response = await fetch(`/api/host/listings/${listingId}/house-rules`);
  if (!response.ok) throw new Error('Failed to fetch house rules');
  const data = await response.json();
  return data.data || [];
}

export async function createHouseRule(listingId: number, rule: string) {
  const response = await fetch(`/api/host/listings/${listingId}/house-rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rule }),
  });
  if (!response.ok) throw new Error('Failed to create house rule');
  const data = await response.json();
  return data.data;
}

export async function updateHouseRule(listingId: number, ruleId: number, rule: string) {
  const response = await fetch(`/api/host/listings/${listingId}/house-rules/${ruleId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rule }),
  });
  if (!response.ok) throw new Error('Failed to update house rule');
  const data = await response.json();
  return data.data;
}

export async function deleteHouseRule(listingId: number, ruleId: number) {
  const response = await fetch(`/api/host/listings/${listingId}/house-rules/${ruleId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete house rule');
  return true;
}
