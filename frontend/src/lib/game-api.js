import { API_URL } from './api';

const TOKEN_KEY = 'state-sandbox-token';

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
  };
}

async function request(method, path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API error: ${res.statusText}`);
  }
  return res.json();
}

export const gameApi = {
  getGameState: (stateId) => request('GET', `/api/game/${stateId}`),
  trainUnit: (stateId, unitType, cityId) => request('POST', `/api/game/${stateId}/unit/train`, { unit_type: unitType, city_id: cityId }),
  moveUnit: (stateId, unitId, toCol, toRow) => request('POST', `/api/game/${stateId}/unit/move`, { unit_id: unitId, to_col: toCol, to_row: toRow }),
  attackUnit: (stateId, unitId, targetCol, targetRow) => request('POST', `/api/game/${stateId}/unit/attack`, { unit_id: unitId, target_col: targetCol, target_row: targetRow }),
  disbandUnit: (stateId, unitId) => request('DELETE', `/api/game/${stateId}/unit/${unitId}`),
  buildInCity: (stateId, cityId, row, col, buildingType) => request('POST', `/api/game/${stateId}/city/build`, { city_id: cityId, row, col, building_type: buildingType }),
  demolishInCity: (stateId, cityId, row, col) => request('POST', `/api/game/${stateId}/city/demolish`, { city_id: cityId, row, col }),
  researchTech: (stateId, techId) => request('POST', `/api/game/${stateId}/research`, { tech_id: techId }),
  diplomacyAction: (stateId, aiCountryId, action) => request('POST', `/api/game/${stateId}/diplomacy`, { ai_country_id: aiCountryId, action }),
  endTurn: (stateId) => request('POST', `/api/game/${stateId}/end-turn`, {}),
};
