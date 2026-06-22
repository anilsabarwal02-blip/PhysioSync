const getApiBaseUrl = () => {
  const { hostname, port } = window.location;

  // If we are running on Vercel or a deployed production domain
  const isProduction = hostname.endsWith('.vercel.app') ||
    (hostname !== 'localhost' && hostname !== '127.0.0.1' && !/^(192\.168\.|10\.|172\.)/.test(hostname) && !port);

  if (isProduction) {
    return '/api';
  }

  // Otherwise (local development or Capacitor development), connect to port 5000 of the hostname
  return `http://${hostname}:5000/api`;
};

const API_BASE_URL = getApiBaseUrl();
let isBackendOffline = false;

// Health check endpoint simulation or connection status checker
export function getBackendStatus() {
  return !isBackendOffline;
}

export function resetBackendStatus() {
  isBackendOffline = false;
}

// Low-level fetch helper
async function request(endpoint, options = {}) {
  if (isBackendOffline) {
    throw new Error('Backend is in offline mode.');
  }

  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  const config = {
    ...options,
    headers,
    signal: controller.signal
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    // If backend is unreachable or request timed out/aborted, toggle offline fallback
    if (
      err.name === 'AbortError' ||
      err.message.includes('Failed to fetch') ||
      err.message.includes('NetworkError') ||
      err.message.includes('timeout')
    ) {
      isBackendOffline = true;
      console.warn('[API] PhysioSync Express Backend is offline or hanging. Switching to local mock/localStorage fallback mode.');
    }
    throw err;
  }
}

// --- API SERVICES ---

export const api = {
  // Auth Services
  login: async (doctorId, password) => {
    resetBackendStatus(); // retry on manual user login
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ doctorId, password })
    });
    localStorage.setItem('token', data.token);
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    localStorage.setItem('isAuthenticated', 'true');
    return data;
  },

  register: async (name, password) => {
    resetBackendStatus();
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, password })
    });
  },

  getCurrentUser: async () => {
    try {
      return await request('/auth/me');
    } catch {
      const stored = localStorage.getItem('currentUser');
      return stored ? JSON.parse(stored) : null;
    }
  },

  // Appointments Services
  getAppointments: async () => {
    return request('/appointments');
  },

  createAppointment: async (appData) => {
    return request('/appointments', {
      method: 'POST',
      body: JSON.stringify(appData)
    });
  },

  deleteAppointment: async (id) => {
    return request(`/appointments/${id}`, {
      method: 'DELETE'
    });
  },

  getDashboardStats: async () => {
    return request('/dashboard/stats');
  },

  // Patients & Logbook Services
  getPatients: async () => {
    return request('/patients');
  },

  createPatient: async (patientData) => {
    return request('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData)
    });
  },

  getLogs: async () => {
    return request('/patients/logs');
  },

  approveLog: async (id) => {
    return request(`/patients/logs/${id}`, {
      method: 'PUT'
    });
  },

  // Protocols Services
  getProtocol: async (patientName) => {
    return request(`/protocols/${patientName}`);
  },

  saveProtocol: async (protocolData) => {
    return request('/protocols', {
      method: 'PUT',
      body: JSON.stringify(protocolData)
    });
  },

  // EMR Notes Services
  getNotes: async () => {
    return request('/notes');
  },

  saveNote: async (noteData) => {
    return request('/notes', {
      method: 'POST',
      body: JSON.stringify(noteData)
    });
  },

  // Wearables Services
  getWearables: async (patientName) => {
    return request(`/wearables/${patientName}`);
  },

  syncWearables: async (wearablesData) => {
    return request('/wearables', {
      method: 'PUT',
      body: JSON.stringify(wearablesData)
    });
  },

  // Patients soft delete
  deletePatient: async (id) => {
    return request(`/patients/${id}`, {
      method: 'DELETE'
    });
  },

  // Recycle Bin Services
  getRecycleBin: async () => {
    return request('/recycle-bin');
  },

  restoreAppointment: async (id) => {
    return request(`/recycle-bin/restore/appointments/${id}`, {
      method: 'PUT'
    });
  },

  restorePatient: async (id) => {
    return request(`/recycle-bin/restore/patients/${id}`, {
      method: 'PUT'
    });
  },

  permanentDeleteAppointment: async (id) => {
    return request(`/recycle-bin/permanent/appointments/${id}`, {
      method: 'DELETE'
    });
  },

  permanentDeletePatient: async (id) => {
    return request(`/recycle-bin/permanent/patients/${id}`, {
      method: 'DELETE'
    });
  },

  emptyRecycleBin: async () => {
    return request('/recycle-bin/empty', {
      method: 'DELETE'
    });
  }
};
