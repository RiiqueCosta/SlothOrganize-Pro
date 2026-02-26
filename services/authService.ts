import { User } from '../types';

const USERS_STORAGE_KEY = 'sloth_users_db';
const SESSION_KEY = 'sloth_current_session';

// Simula a busca de dados de um servidor com um pequeno atraso.
const getUsersDB = async (): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, 200)); // Simula latência de rede
  try {
    const users = localStorage.getItem(USERS_STORAGE_KEY);
    return users ? JSON.parse(users) : [];
  } catch (e) {
    return [];
  }
};

const saveUsersDB = (users: any[]) => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

export const authService = {
  // Tenta fazer login, agora de forma assíncrona
  login: async (email: string, password: string): Promise<User | null> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) return null;
      const user = await response.json();
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return user;
    } catch (e) {
      console.error("Login error", e);
      return null;
    }
  },

  // Registra um novo usuário, agora de forma assíncrona
  register: async (name: string, email: string, password: string): Promise<User | { error: string }> => {
    // For this demo, login and register are handled by the same endpoint
    return authService.login(email, password) as any;
  },

  // Encerra a sessão
  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  // Verifica se já existe alguém logado, agora de forma assíncrona
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const session = localStorage.getItem(SESSION_KEY);
      return session ? JSON.parse(session) : null;
    } catch (e) {
      return null;
    }
  }
};
