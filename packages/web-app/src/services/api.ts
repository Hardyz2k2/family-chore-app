import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
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

  async updateFamilyConfig(familyId: string, config: { bin_schedule?: any; pets?: any; gaming_schedule?: any }) {
    const response = await this.client.patch(`/families/${familyId}/config`, config);
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

  async transferChore(assignedChoreId: string, toUserId: string) {
    const response = await this.client.post(`/chores/assigned/${assignedChoreId}/transfer`, { to_user_id: toUserId });
    return response.data;
  }

  async requestSupport(assignedChoreId: string, helperUserId: string) {
    const response = await this.client.post(`/chores/assigned/${assignedChoreId}/support`, { helper_user_id: helperUserId });
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

  async createReward(data: { family_id: string; reward_name: string; description?: string; point_cost: number; reward_type?: string; child_id?: string | null }) {
    const response = await this.client.post('/rewards', data);
    return response.data;
  }

  async createRewardsBulk(familyId: string, rewards: Array<{ reward_name: string; description?: string; point_cost: number; reward_type: string }>) {
    const response = await this.client.post('/rewards/bulk', { family_id: familyId, rewards });
    return response.data;
  }

  async redeemReward(userId: string, rewardId: string) {
    const response = await this.client.post('/rewards/redeem', { user_id: userId, reward_id: rewardId });
    return response.data;
  }

  async getExtraChores(userId: string) {
    const response = await this.client.get(`/users/${userId}/extra-chores`);
    return response.data;
  }

  async claimExtraChore(userId: string, choreId: string) {
    const response = await this.client.post(`/users/${userId}/extra-chores`, { chore_id: choreId });
    return response.data;
  }

  async getUserStats(userId: string) {
    const response = await this.client.get(`/users/${userId}/stats`);
    return response.data;
  }

  async getLeaderboard(familyId: string) {
    const response = await this.client.get(`/families/${familyId}/leaderboard`);
    return response.data;
  }

  async getBadges(familyId: string) {
    const response = await this.client.get(`/families/${familyId}/badges`);
    return response.data;
  }

  async updateReward(rewardId: string, data: { reward_name?: string; description?: string; point_cost?: number; reward_type?: string; child_id?: string | null }) {
    const response = await this.client.patch(`/rewards/${rewardId}`, data);
    return response.data;
  }

  async deleteReward(rewardId: string) {
    const response = await this.client.delete(`/rewards/${rewardId}`);
    return response.data;
  }

  // Parent participation
  async getParticipation(userId: string) {
    const response = await this.client.get(`/users/${userId}/participate`);
    return response.data;
  }

  async setParticipation(userId: string, participate: boolean) {
    const response = await this.client.patch(`/users/${userId}/participate`, { participate });
    return response.data;
  }

  // Jobs Board
  async createJob(data: { family_id: string; title: string; description?: string; reward_type: string; reward_amount: number; job_type: string; due_date?: string }) {
    const response = await this.client.post('/jobs', data);
    return response.data;
  }

  async getJobs(familyId: string) {
    const response = await this.client.get(`/families/${familyId}/jobs`);
    return response.data;
  }

  async applyToJob(jobId: string, data: { reason?: string; bid_amount?: number }) {
    const response = await this.client.post(`/jobs/${jobId}/apply`, data);
    return response.data;
  }

  async getJobApplications(jobId: string) {
    const response = await this.client.get(`/jobs/${jobId}/applications`);
    return response.data;
  }

  async assignJob(jobId: string, applicationId: string) {
    const response = await this.client.post(`/jobs/${jobId}/assign`, { application_id: applicationId });
    return response.data;
  }

  async completeJob(jobId: string) {
    const response = await this.client.post(`/jobs/${jobId}/complete`);
    return response.data;
  }

  async confirmJob(jobId: string) {
    const response = await this.client.post(`/jobs/${jobId}/confirm`);
    return response.data;
  }

  // AI
  async textToSpeech(text: string): Promise<{ audio_base64: string; content_type: string }> {
    const response = await this.client.post('/ai/tts', { text });
    return response.data;
  }

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

  // Room Analysis (House Scanning)
  async analyzeRoom(imageData: string) {
    const response = await this.client.post('/ai/analyze-room', { image: imageData });
    return response.data;
  }

  async addRoomsAndChores(familyId: string, rooms: Array<{ name: string; suggestedChores: string[] }>) {
    const response = await this.client.post(`/families/${familyId}/rooms`, { rooms });
    return response.data;
  }

  // Screen Time Management
  async getScreenTimeSettings(userId: string) {
    const response = await this.client.get(`/users/${userId}/screen-time`);
    return response.data;
  }

  async updateScreenTimeSettings(userId: string, settings: {
    daily_limit_minutes: number;
    must_complete_daily_chores: boolean;
    minimum_points_required: number;
  }) {
    const response = await this.client.put(`/users/${userId}/screen-time`, settings);
    return response.data;
  }

  async checkScreenTimeAccess(userId: string) {
    const response = await this.client.get(`/users/${userId}/screen-time/access`);
    return response.data;
  }

  // Child Invitation System
  async createChildInvitation(childUserId: string) {
    const response = await this.client.post(`/children/${childUserId}/invite`);
    return response.data;
  }

  async validateInvitation(token: string) {
    const response = await this.client.get(`/invitations/${token}`);
    return response.data;
  }

  async claimInvitation(token: string, data: { email: string; password: string }) {
    const response = await this.client.post(`/invitations/${token}/claim`, data);
    return response.data;
  }
}

export default new ApiService();
