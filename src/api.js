import axios from 'axios';

// Base URL comes from VITE_API_URL (see .env.example). Falls back to local backend.
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({ baseURL: API_BASE });

// Full URL for a stored audio file (backend serves it at /api/audio/:filename).
export const audioUrl = (filename) => `${API_BASE}/audio/${encodeURIComponent(filename)}`;

export default api;
