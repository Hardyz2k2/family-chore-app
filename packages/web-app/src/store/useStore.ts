import { create } from 'zustand';
import { User, Family, AssignedChore, Reward, LeaderboardEntry } from '../types';

interface AppState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  family: Family | null;
  chores: AssignedChore[];
  pendingApprovals: AssignedChore[];
  rewards: Reward[];
  points: number;
  leaderboard: LeaderboardEntry[];

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setFamily: (family: Family | null) => void;
  setChores: (chores: AssignedChore[]) => void;
  setPendingApprovals: (approvals: AssignedChore[]) => void;
  setRewards: (rewards: Reward[]) => void;
  setPoints: (points: number) => void;
  setLeaderboard: (leaderboard: LeaderboardEntry[]) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  initializeAuth: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  family: null,
  chores: [],
  pendingApprovals: [],
  rewards: [],
  points: 0,
  leaderboard: [],

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setToken: (token) => {
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
    set({ token });
  },

  setFamily: (family) => set({ family }),
  setChores: (chores) => set({ chores }),
  setPendingApprovals: (pendingApprovals) => set({ pendingApprovals }),
  setRewards: (rewards) => set({ rewards }),
  setPoints: (points) => set({ points }),
  setLeaderboard: (leaderboard) => set({ leaderboard }),
  setLoading: (isLoading) => set({ isLoading }),

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      family: null,
      chores: [],
      pendingApprovals: [],
      rewards: [],
      points: 0,
      leaderboard: [],
    });
  },

  initializeAuth: () => {
    const token = localStorage.getItem('authToken');
    const userJson = localStorage.getItem('user');

    if (token && userJson) {
      const user = JSON.parse(userJson);
      set({ token, user, isAuthenticated: true, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },
}));
