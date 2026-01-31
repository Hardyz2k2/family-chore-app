export interface User {
  userId: string;
  email?: string;
  firstName: string;
  lastName?: string;
  role: 'parent' | 'child';
  familyId?: string;
  age?: number;
  points?: number;
  emoji?: string;
}

export interface Family {
  familyId: string;
  familyName: string;
  houseType?: string;
  members: FamilyMember[];
}

export interface FamilyMember {
  userId: string;
  firstName: string;
  nickname?: string;
  role: 'parent' | 'child';
  age?: number;
}

export interface Chore {
  choreId: string;
  familyId: string;
  choreName: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'once';
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  roomType?: string;
}

export interface AssignedChore {
  assignedChoreId: string;
  choreId: string;
  userId: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected';
  proofImageUrl?: string;
  choreName: string;
  description?: string;
  points: number;
  difficulty: string;
  firstName?: string;
  completedAt?: string;
}

export interface Reward {
  rewardId: string;
  familyId: string;
  rewardName: string;
  description?: string;
  pointCost: number;
  isActive: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  points: number;
}
