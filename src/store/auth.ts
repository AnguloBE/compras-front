import { create } from 'zustand';
import { Usuario } from '@/types';
import api from '@/lib/api';

interface AuthState {
  user: Usuario | null;
  token: string | null;
  isLoading: boolean;
  setUser: (user: Usuario | null) => void;
  setToken: (token: string | null) => void;
  login: (token: string, usuario?: Usuario) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  setUser: (user) => set({ user }),
  
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token });
  },

  login: async (token: string, usuario?: Usuario) => {
    console.log('Login iniciado con token:', token?.substring(0, 20) + '...');
    console.log('Usuario proporcionado:', usuario);
    
    set({ isLoading: true });
    try {
      // Guardar token primero
      localStorage.setItem('token', token);
      console.log('Token guardado en localStorage');
      
      if (usuario) {
        // Si ya tenemos el usuario, usarlo directamente
        console.log('Usando usuario proporcionado');
        set({ user: usuario, token, isLoading: false });
      } else {
        // Si no, intentar obtenerlo del backend
        console.log('Intentando obtener perfil del backend...');
        try {
          const response = await api.get('/auth/perfil');
          console.log('Perfil obtenido:', response.data);
          set({ user: response.data, token, isLoading: false });
        } catch (error) {
          // Si falla, solo guardar el token
          console.warn('No se pudo obtener perfil, usando token solo:', error);
          set({ token, isLoading: false });
        }
      }
      
      console.log('Login completado exitosamente');
    } catch (error) {
      console.error('Error en login:', error);
      localStorage.removeItem('token');
      set({ user: null, token: null, isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (token) {
      set({ isLoading: true, token });
      try {
        const response = await api.get('/auth/perfil');
        set({ user: response.data, token, isLoading: false });
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        // Si el token es inválido (401), limpiarlo
        localStorage.removeItem('token');
        set({ isLoading: false, user: null, token: null });
      }
    } else {
      set({ isLoading: false, user: null, token: null });
    }
  },
}));
