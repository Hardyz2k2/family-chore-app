import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async register(data: { email: string; password: string; first_name: string; last_name: string }) {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  async login(data: { email: string; password: string }) {
    const response = await this.client.post('/auth/login', data);
    return response.data;
  }

  async getProfile() {
    const response = await this.client.get('/auth/profile');
    return response.data;
  }

  // Family
  async createFamily(data: { family_name: string; house_type: string }) {
    const response = await this.client.post('/families', data);
    return response.data;
  }

  async addChild(familyId: string, data: { first_name: string; nickname?: string; age: number; emoji?: string }) {
    const response = await this.client.post(`/families/${familyId}/members`, data);
    return response.data;
  }

  async getFamilyDetails(familyId: string) {
    const response = await this.client.get(`/families/${familyId}`);
    return response.data;
  }

  // Chores
  async getChoresForUser(userId: string) {
    const response = await this.client.get(`/users/${userId}/chores`);
    return response.data;
  }

  async getChoresForFamily(familyId: string) {
    const response = await this.client.get(`/families/${familyId}/chores`);
    return response.data;
  }

  async createChore(data: { family_id: string; chore_name: string; description?: string; frequency: string; difficulty: string; points: number }) {
    const response = await this.client.post('/chores', data);
    return response.data;
  }

  async assignChore(data: { chore_id: string; user_id: string; due_date: string }) {
    const response = await this.client.post('/chores/assign', data);
    return response.data;
  }

  async updateChoreStatus(assignedChoreId: string, status: string) {
    const response = await this.client.patch(`/chores/assigned/${assignedChoreId}`, { status });
    return response.data;
  }

  async getPendingApprovals(familyId: string) {
    const response = await this.client.get(`/families/${familyId}/approvals`);
    return response.data;
  }

  async approveChore(assignedChoreId: string) {
    const response = await this.client.post(`/chores/assigned/${assignedChoreId}/approve`);
    return response.data;
  }

  // Gamification
  async getUserPoints(userId: string) {
    const response = await this.client.get(`/users/${userId}/points`);
    return response.data;
  }

  async getRewards(familyId: string) {
    const response = await this.client.get(`/families/${familyId}/rewards`);
    return response.data;
  }

  async createReward(data: { family_id: string; reward_name: string; description?: string; point_cost: number }) {
    const response = await this.client.post('/rewards', data);
    return response.data;
  }

  async redeemReward(userId: string, rewardId: string) {
    const response = await this.client.post('/rewards/redeem', { user_id: userId, reward_id: rewardId });
    return response.data;
  }

  async getLeaderboard(familyId: string) {
    const response = await this.client.get(`/families/${familyId}/leaderboard`);
    return response.data;
  }

  // AI
  async processVoiceSetup(sessionId: string | null, textInput: string) {
    const response = await this.client.post('/ai/voice-setup', {
      session_id: sessionId,
      text_input: textInput,
    });
    return response.data;
  }

  async distributeChores(familyId: string) {
    const response = await this.client.post(`/ai/families/${familyId}/distribute-chores`);
    return response.data;
  }
}

export default new ApiService();
