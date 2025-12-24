import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    const url = error.config?.url;

    console.error('Error en API:', {
      status,
      url,
      message,
      fullError: error.response?.data,
    });

    // Mostrar toast con el error
    if (status === 401) {
      toast.error(`No autorizado: ${message || 'Sesión inválida o expirada'}`);
    } else if (status === 403) {
      toast.error(`Acceso denegado: ${message || 'No tienes permisos'}`);
    } else if (status === 404) {
      toast.error(`No encontrado: ${message || 'Recurso no encontrado'}`);
    } else if (status === 500) {
      toast.error(`Error del servidor: ${message || 'Error interno'}`);
    } else if (status >= 400) {
      toast.error(message || 'Error en la solicitud');
    }

    return Promise.reject(error);
  }
);

export default api;
