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

export interface BinSchedule {
  collection_days: string[];
  rotation_children: string[];
  rotation_week_start: string;
}

export interface Pet {
  id: string;
  name: string;
  type: 'dog' | 'cat' | 'other';
  walk_rotation_children?: string[];
  litter_rotation_children?: string[];
  min_walk_age?: number;
}

export interface GamingRule {
  days: string[];
  device: string;
  hours: number;
}

export interface HouseDetails {
  scanned_rooms?: Array<{ name: string; confidence: number; assets: string[] }>;
  bin_schedule?: BinSchedule;
  pets?: Pet[];
  gaming_schedule?: Record<string, { rules: GamingRule[] }>;
}

export interface Family {
  familyId: string;
  familyName: string;
  houseType?: string;
  houseDetails?: HouseDetails;
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
  rewardType: 'daily' | 'weekly' | 'family_target';
  childId?: string | null;
  childName?: string | null;
  isActive: boolean;
}

export interface Badge {
  userId: string;
  firstName: string;
  weeklySuperstar: boolean;
  monthlyHero: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  points: number;
}
