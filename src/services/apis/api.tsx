//const API_BASE_URL = 'http://localhost:8087/api';
//console.log("🌐 FE Hostname Detected:", window.location.hostname);
// For REST APIs
const API_BASE_URL = `http://${window.location.hostname}:8087/api`;
const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

export const login = async (username, password) => {
  const response = await fetch(`${API_BASE_URL}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  return response.json();
};

export const getStations = async () => {
  const response = await fetch(`${API_BASE_URL}/admin/stations`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch stations');
  }

  return response.json();
};

export const createStation = async (stationData) => {
  const response = await fetch(`${API_BASE_URL}/admin/stations`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(stationData)
  });

  if (!response.ok) {
    throw new Error('Failed to create station');
  }

  return response.json();
};

export const deleteStation = async (stationId) => {
  const response = await fetch(`${API_BASE_URL}/admin/stations/${stationId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to delete station');
  }

  return response.json();
};

export const lockStation = async (stationId) => {
  const response = await fetch(`${API_BASE_URL}/admin/stations/${stationId}/lock`, {
    method: 'POST',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to lock station');
  }

  return response.json();
};

export const unlockStation = async (stationId) => {
  const response = await fetch(`${API_BASE_URL}/admin/stations/${stationId}/unlock`, {
    method: 'POST',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to unlock station');
  }

  return response.json();
};

export const startSession = async (stationId, sessionData) => {
  const response = await fetch(`${API_BASE_URL}/admin/sessions/start`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      stationId,
      ...sessionData
    })
  });

  if (!response.ok) {
    throw new Error('Failed to start session');
  }

  return response.json();
};

export async function endSession(sessionId: string | number) {
  const response = await fetch(`${API_BASE_URL}/admin/sessions/${sessionId}/end`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to end session");
  }
  return response.json();
}

export const addTime = async (sessionId, minutes) => {
  const response = await fetch(`${API_BASE_URL}/admin/sessions/${sessionId}/add-time`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ minutes })
  });

  if (!response.ok) {
    throw new Error('Failed to add time');
  }

  return response.json();
};

// System Configuration APIs
export const getSystemConfig = async () => {
  const response = await fetch(`${API_BASE_URL}/admin/system-config/latest`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch system configuration');
  }

  return response.json();
};

export const saveSystemConfig = async (configData) => {
  const response = await fetch(`${API_BASE_URL}/admin/system-config`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(configData)
  });

  if (!response.ok) {
    throw new Error('Failed to save system configuration');
  }

  return response.json();
};