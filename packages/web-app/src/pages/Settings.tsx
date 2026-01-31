import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Users,
  UserPlus,
  List,
  Gift,
  RefreshCw,
  Bell,
  Mail,
  Lock,
  HelpCircle,
  FileText,
  LogOut,
  Plus,
  X,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import api from '../services/api';

export default function Settings() {
  const navigate = useNavigate();
  const { user, family, logout, setFamily } = useStore();
  const isParent = user?.role === 'parent';

  const [showAddChild, setShowAddChild] = useState(false);
  const [showAddReward, setShowAddReward] = useState(false);
  const [showAddChore, setShowAddChore] = useState(false);

  // Add Child form
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState(5);

  // Add Reward form
  const [rewardName, setRewardName] = useState('');
  const [rewardCost, setRewardCost] = useState(50);
  const [rewardDesc, setRewardDesc] = useState('');

  // Add Chore form
  const [choreName, setChoreName] = useState('');
  const [choreDesc, setChoreDesc] = useState('');
  const [choreDifficulty, setChoreDifficulty] = useState('medium');
  const [chorePoints, setChorePoints] = useState(15);

  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      logout();
      navigate('/login');
    }
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family?.familyId || !childName.trim()) return;

    setLoading(true);
    try {
      await api.addChild(family.familyId, { first_name: childName, age: childAge });
      const familyDetails = await api.getFamilyDetails(family.familyId);
      setFamily({ ...family, members: familyDetails.members });
      setChildName('');
      setChildAge(5);
      setShowAddChild(false);
      alert('Child added successfully!');
    } catch (error) {
      alert('Failed to add child');
    } finally {
      setLoading(false);
    }
  };

  const handleAddReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family?.familyId || !rewardName.trim()) return;

    setLoading(true);
    try {
      await api.createReward({
        family_id: family.familyId,
        reward_name: rewardName,
        description: rewardDesc,
        point_cost: rewardCost,
      });
      setRewardName('');
      setRewardCost(50);
      setRewardDesc('');
      setShowAddReward(false);
      alert('Reward added successfully!');
    } catch (error) {
      alert('Failed to add reward');
    } finally {
      setLoading(false);
    }
  };

  const handleAddChore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family?.familyId || !choreName.trim()) return;

    setLoading(true);
    try {
      await api.createChore({
        family_id: family.familyId,
        chore_name: choreName,
        description: choreDesc,
        frequency: 'weekly',
        difficulty: choreDifficulty,
        points: chorePoints,
      });
      setChoreName('');
      setChoreDesc('');
      setChoreDifficulty('medium');
      setChorePoints(15);
      setShowAddChore(false);
      alert('Chore added successfully!');
    } catch (error) {
      alert('Failed to add chore');
    } finally {
      setLoading(false);
    }
  };

  const handleRedistribute = async () => {
    if (!family?.familyId) return;
    if (!confirm('This will generate new weekly chore assignments for all children. Continue?')) return;

    setLoading(true);
    try {
      await api.distributeChores(family.familyId);
      alert('Chores redistributed successfully!');
    } catch (error) {
      alert('Failed to redistribute chores');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user?.firstName?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-gray-500">{isParent ? 'Parent' : 'Child'}</p>
          </div>
        </div>
      </div>

      {/* Family */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-700">Family</h3>
        </div>
        <div className="divide-y">
          <div className="p-4 flex items-center gap-3">
            <Users className="text-primary-600" size={20} />
            <div className="flex-1">
              <p className="font-medium">{family?.familyName || 'My Family'}</p>
              <p className="text-sm text-gray-500">{family?.members?.length || 0} members</p>
            </div>
          </div>
          {isParent && (
            <button
              onClick={() => setShowAddChild(true)}
              className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition text-left"
            >
              <UserPlus className="text-primary-600" size={20} />
              <span className="font-medium">Add Family Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Chore Management (Parents) */}
      {isParent && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-700">Chore Management</h3>
          </div>
          <div className="divide-y">
            <button
              onClick={() => setShowAddChore(true)}
              className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition text-left"
            >
              <List className="text-primary-600" size={20} />
              <div>
                <p className="font-medium">Add New Chore</p>
                <p className="text-sm text-gray-500">Create a new chore for the family</p>
              </div>
            </button>
            <button
              onClick={() => setShowAddReward(true)}
              className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition text-left"
            >
              <Gift className="text-primary-600" size={20} />
              <div>
                <p className="font-medium">Add New Reward</p>
                <p className="text-sm text-gray-500">Create rewards for children to redeem</p>
              </div>
            </button>
            <button
              onClick={handleRedistribute}
              disabled={loading}
              className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition text-left disabled:opacity-50"
            >
              <RefreshCw className={`text-primary-600 ${loading ? 'animate-spin' : ''}`} size={20} />
              <div>
                <p className="font-medium">Redistribute Chores</p>
                <p className="text-sm text-gray-500">Generate new weekly assignments</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Account */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-700">Account</h3>
        </div>
        <div className="divide-y">
          <div className="p-4 flex items-center gap-3">
            <Mail className="text-primary-600" size={20} />
            <div>
              <p className="font-medium">Email</p>
              <p className="text-sm text-gray-500">{user?.email || 'Not set'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full bg-white rounded-xl shadow-sm border p-4 flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 transition"
      >
        <LogOut size={20} />
        <span className="font-semibold">Log Out</span>
      </button>

      <p className="text-center text-gray-400 text-sm">Version 1.0.0</p>

      {/* Add Child Modal */}
      {showAddChild && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Child</h3>
              <button onClick={() => setShowAddChild(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddChild} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input
                  type="number"
                  min="1"
                  max="18"
                  value={childAge}
                  onChange={(e) => setChildAge(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 text-white py-2 rounded-lg font-semibold disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Child'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Reward Modal */}
      {showAddReward && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Reward</h3>
              <button onClick={() => setShowAddReward(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddReward} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reward Name</label>
                <input
                  type="text"
                  value={rewardName}
                  onChange={(e) => setRewardName(e.target.value)}
                  placeholder="e.g., 30 min extra screen time"
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={rewardDesc}
                  onChange={(e) => setRewardDesc(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Point Cost</label>
                <input
                  type="number"
                  min="1"
                  value={rewardCost}
                  onChange={(e) => setRewardCost(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 text-white py-2 rounded-lg font-semibold disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Reward'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Chore Modal */}
      {showAddChore && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Chore</h3>
              <button onClick={() => setShowAddChore(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddChore} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chore Name</label>
                <input
                  type="text"
                  value={choreName}
                  onChange={(e) => setChoreName(e.target.value)}
                  placeholder="e.g., Make bed"
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={choreDesc}
                  onChange={(e) => setChoreDesc(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                <select
                  value={choreDifficulty}
                  onChange={(e) => setChoreDifficulty(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="easy">Easy (10 pts)</option>
                  <option value="medium">Medium (15 pts)</option>
                  <option value="hard">Hard (25 pts)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                <input
                  type="number"
                  min="1"
                  value={chorePoints}
                  onChange={(e) => setChorePoints(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 text-white py-2 rounded-lg font-semibold disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Chore'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
