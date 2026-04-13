import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  List,
  Gift,
  RefreshCw,
  Mail,
  LogOut,
  X,
  Link,
  Copy,
  Check,
  Send,
  Trash2,
  Edit3,
  Plus,
  ChevronDown,
  ChevronUp,
  Camera,
  Loader2,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import api from '../services/api';
import { Reward, HouseDetails, Pet, GamingRule } from '../types';

interface InvitationLink {
  childId: string;
  childName: string;
  token: string;
  expiresAt: string;
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, family, logout, setFamily } = useStore();
  const isParent = user?.role === 'parent';

  const [showAddChild, setShowAddChild] = useState(false);
  const [showAddReward, setShowAddReward] = useState(false);
  const [showAddChore, setShowAddChore] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRewardsManager, setShowRewardsManager] = useState(false);

  // Add Child form
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState(5);

  // Add Reward form
  const [rewardName, setRewardName] = useState('');
  const [rewardCost, setRewardCost] = useState(50);
  const [rewardDesc, setRewardDesc] = useState('');
  const [rewardType, setRewardType] = useState<string>('daily');
  const [rewardChildId, setRewardChildId] = useState<string>('');

  // Edit Reward
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCost, setEditCost] = useState(50);
  const [editType, setEditType] = useState('daily');
  const [editChildId, setEditChildId] = useState<string>('');

  // Add Chore form
  const [choreName, setChoreName] = useState('');
  const [choreDesc, setChoreDesc] = useState('');
  const [choreDifficulty, setChoreDifficulty] = useState('medium');
  const [chorePoints, setChorePoints] = useState(15);
  const [choreFrequency, setChoreFrequency] = useState('weekly');

  // Invitation state
  const [invitationLink, setInvitationLink] = useState<InvitationLink | null>(null);
  const [invitingChildId, setInvitingChildId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Rewards list
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [rewardsLoading, setRewardsLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [participateInChores, setParticipateInChores] = useState(false);

  // Room scanning
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Household routines
  const [showBinEditor, setShowBinEditor] = useState(false);
  const [showPetEditor, setShowPetEditor] = useState(false);
  const [showGamingEditor, setShowGamingEditor] = useState(false);
  const [houseDetails, setHouseDetails] = useState<HouseDetails>({});

  // Bin schedule form
  const [binDays, setBinDays] = useState<string[]>([]);
  const [binRotationChildren, setBinRotationChildren] = useState<string[]>([]);

  // Pet form
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState<'dog' | 'cat' | 'other'>('dog');
  const [petWalkChildren, setPetWalkChildren] = useState<string[]>([]);
  const [petLitterChildren, setPetLitterChildren] = useState<string[]>([]);

  // Gaming form
  const [gamingChildId, setGamingChildId] = useState('');
  const [gamingDevice, setGamingDevice] = useState('pc');
  const [gamingDays, setGamingDays] = useState<string[]>([]);
  const [gamingHours, setGamingHours] = useState(1);

  useEffect(() => {
    if (isParent && family?.familyId) {
      loadRewards();
      loadParticipation();
      if (family.houseDetails) {
        setHouseDetails(family.houseDetails);
        if (family.houseDetails.bin_schedule) {
          setBinDays(family.houseDetails.bin_schedule.collection_days || []);
          setBinRotationChildren(family.houseDetails.bin_schedule.rotation_children || []);
        }
      }
    }
  }, [family?.familyId]);

  const loadParticipation = async () => {
    if (!user?.userId) return;
    try {
      const data = await api.getParticipation(user.userId);
      setParticipateInChores(data.participate_in_chores);
    } catch {}
  };

  const handleToggleParticipation = async () => {
    if (!user?.userId) return;
    const newValue = !participateInChores;
    setParticipateInChores(newValue);
    try {
      await api.setParticipation(user.userId, newValue);
    } catch {
      setParticipateInChores(!newValue); // revert on error
    }
  };

  const loadRewards = async () => {
    if (!family?.familyId) return;
    setRewardsLoading(true);
    try {
      const data = await api.getRewards(family.familyId);
      setRewards(data);
    } catch (error) {
      console.error('Error loading rewards:', error);
    } finally {
      setRewardsLoading(false);
    }
  };

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
        reward_type: rewardType,
        child_id: rewardChildId || null,
      });
      setRewardName('');
      setRewardCost(50);
      setRewardDesc('');
      setRewardType('daily');
      setRewardChildId('');
      setShowAddReward(false);
      await loadRewards();
      alert('Reward added successfully!');
    } catch (error) {
      alert('Failed to add reward');
    } finally {
      setLoading(false);
    }
  };

  const handleEditReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReward) return;

    setLoading(true);
    try {
      await api.updateReward(editingReward.rewardId, {
        reward_name: editName,
        description: editDesc,
        point_cost: editCost,
        reward_type: editType,
        child_id: editChildId || null,
      });
      setEditingReward(null);
      await loadRewards();
    } catch (error) {
      alert('Failed to update reward');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReward = async (rewardId: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await api.deleteReward(rewardId);
      await loadRewards();
    } catch (error) {
      alert('Failed to delete reward');
    }
  };

  const startEditReward = (reward: Reward) => {
    setEditingReward(reward);
    setEditName(reward.rewardName);
    setEditDesc(reward.description || '');
    setEditCost(reward.pointCost);
    setEditType(reward.rewardType || 'daily');
    setEditChildId(reward.childId || '');
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
        frequency: choreFrequency,
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

  const handleInviteChild = async (childId: string, childName: string) => {
    setInvitingChildId(childId);
    setLoading(true);

    try {
      const result = await api.createChildInvitation(childId);
      setInvitationLink({
        childId,
        childName,
        token: result.invitation_token,
        expiresAt: result.expires_at,
      });
      setShowInviteModal(true);
    } catch (error: any) {
      if (error.response?.data?.error === 'Child already has login credentials') {
        alert(`${childName} already has login credentials set up.`);
      } else {
        alert('Failed to create invitation link');
      }
    } finally {
      setLoading(false);
      setInvitingChildId(null);
    }
  };

  const getInviteUrl = () => {
    if (!invitationLink) return '';
    return `${window.location.origin}/join/${invitationLink.token}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getInviteUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      alert('Failed to copy link');
    }
  };

  const children = family?.members?.filter((m: any) => m.role === 'child') || [];
  const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  // Room scanning
  const handleScanRoom = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !family?.familyId) return;
    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const imageData = ev.target?.result as string;
        const result = await api.analyzeRoom(imageData);
        if (result.rooms?.length > 0) {
          await api.addRoomsAndChores(family.familyId, result.rooms);
          // Refresh family details to get updated house_details
          const updated = await api.getFamilyDetails(family.familyId);
          setHouseDetails(updated.house_details || {});
          setFamily({ ...family, houseDetails: updated.house_details });
          alert(`Detected ${result.rooms.map((r: any) => r.name).join(', ')}! Chores added.`);
        } else {
          alert('Could not detect a room. Try a wider angle photo.');
        }
      } catch { alert('Failed to analyze room.'); }
      finally { setIsAnalyzing(false); }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Save bin schedule
  const handleSaveBins = async () => {
    if (!family?.familyId) return;
    setLoading(true);
    try {
      const result = await api.updateFamilyConfig(family.familyId, {
        bin_schedule: { collection_days: binDays, rotation_children: binRotationChildren, rotation_week_start: new Date().toISOString().split('T')[0] }
      });
      setHouseDetails(result.house_details);
      setShowBinEditor(false);
      alert('Bin schedule saved!');
    } catch { alert('Failed to save'); }
    finally { setLoading(false); }
  };

  // Save pet
  const handleAddPet = async () => {
    if (!family?.familyId || !petName.trim()) return;
    setLoading(true);
    const existingPets = houseDetails.pets || [];
    const newPet: Pet = {
      id: Date.now().toString(),
      name: petName,
      type: petType,
      ...(petType === 'dog' ? { walk_rotation_children: petWalkChildren, min_walk_age: 10 } : {}),
      ...(petType === 'cat' ? { litter_rotation_children: petLitterChildren } : {}),
    };
    try {
      const result = await api.updateFamilyConfig(family.familyId, { pets: [...existingPets, newPet] });
      setHouseDetails(result.house_details);
      setPetName(''); setPetWalkChildren([]); setPetLitterChildren([]);
      alert('Pet added!');
    } catch { alert('Failed to save'); }
    finally { setLoading(false); }
  };

  const handleDeletePet = async (petId: string) => {
    if (!family?.familyId) return;
    const updated = (houseDetails.pets || []).filter(p => p.id !== petId);
    try {
      const result = await api.updateFamilyConfig(family.familyId, { pets: updated });
      setHouseDetails(result.house_details);
    } catch { alert('Failed to delete'); }
  };

  // Save gaming rule
  const handleAddGamingRule = async () => {
    if (!family?.familyId || !gamingChildId || gamingDays.length === 0) return;
    setLoading(true);
    const schedule = { ...(houseDetails.gaming_schedule || {}) };
    if (!schedule[gamingChildId]) schedule[gamingChildId] = { rules: [] };
    schedule[gamingChildId].rules.push({ days: gamingDays, device: gamingDevice, hours: gamingHours });
    try {
      const result = await api.updateFamilyConfig(family.familyId, { gaming_schedule: schedule });
      setHouseDetails(result.house_details);
      setGamingDays([]); setGamingDevice('pc'); setGamingHours(1);
      alert('Gaming rule added!');
    } catch { alert('Failed to save'); }
    finally { setLoading(false); }
  };

  const handleDeleteGamingRule = async (childId: string, ruleIdx: number) => {
    if (!family?.familyId) return;
    const schedule = { ...(houseDetails.gaming_schedule || {}) };
    if (schedule[childId]) {
      schedule[childId].rules.splice(ruleIdx, 1);
      if (schedule[childId].rules.length === 0) delete schedule[childId];
    }
    try {
      const result = await api.updateFamilyConfig(family.familyId, { gaming_schedule: schedule });
      setHouseDetails(result.house_details);
    } catch { alert('Failed to delete'); }
  };

  const toggleDay = (day: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(day) ? list.filter(d => d !== day) : [...list, day]);
  };

  const toggleChild = (childId: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(childId) ? list.filter(c => c !== childId) : [...list, childId]);
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

      {/* Children List with Invite Buttons (Parents Only) */}
      {isParent && children.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-700">Children</h3>
            <p className="text-sm text-gray-500">Invite children to create their own login</p>
          </div>
          <div className="divide-y">
            {children.map((child: any) => (
              <div key={child.user_id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
                    {child.first_name?.charAt(0) || child.nickname?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{child.first_name || child.nickname}</p>
                    <p className="text-sm text-gray-500">Age {child.age || 'N/A'}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleInviteChild(child.user_id, child.first_name || child.nickname)}
                  disabled={loading && invitingChildId === child.user_id}
                  className="flex items-center gap-2 px-3 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition disabled:opacity-50"
                >
                  {loading && invitingChildId === child.user_id ? (
                    <span className="text-sm">Creating...</span>
                  ) : (
                    <>
                      <Send size={16} />
                      <span className="text-sm font-medium">Invite</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rewards Management (Parents) */}
      {isParent && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <button
            onClick={() => setShowRewardsManager(!showRewardsManager)}
            className="w-full p-4 border-b bg-gray-50 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Gift className="text-primary-600" size={20} />
              <div className="text-left">
                <h3 className="font-semibold text-gray-700">Rewards</h3>
                <p className="text-sm text-gray-500">{rewards.length} active rewards</p>
              </div>
            </div>
            {showRewardsManager ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
          </button>

          {showRewardsManager && (
            <div className="p-4 space-y-4">
              {/* Add Reward button */}
              <button
                onClick={() => setShowAddReward(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary-400 hover:text-primary-600 transition text-sm font-medium"
              >
                <Plus size={16} />
                Add New Reward
              </button>

              {rewardsLoading ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : rewards.length === 0 ? (
                <p className="text-center text-gray-500 py-6 text-sm">No rewards yet. Add some to motivate your kids!</p>
              ) : (
                <div className="space-y-2">
                  {rewards.map((reward) => (
                    <div key={reward.rewardId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{reward.rewardName}</p>
                        {reward.description && (
                          <p className="text-xs text-gray-500 truncate">{reward.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-primary-600 font-medium">{reward.pointCost} pts</span>
                          {reward.childName ? (
                            <span className="text-[10px] bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full font-medium">{reward.childName} only</span>
                          ) : (
                            <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">All children</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2 shrink-0">
                        <button
                          onClick={() => startEditReward(reward)}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteReward(reward.rewardId, reward.rewardName)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Chore Management (Parents) */}
      {isParent && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-700">Chore Management</h3>
          </div>
          <div className="divide-y">
            {/* Parent participation toggle */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="text-primary-600" size={20} />
                <div>
                  <p className="font-medium">I want to do chores too</p>
                  <p className="text-sm text-gray-500">Include me in the weekly chore rotation</p>
                </div>
              </div>
              <button
                onClick={handleToggleParticipation}
                className={`relative w-12 h-7 rounded-full transition-colors ${participateInChores ? 'bg-primary-600' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${participateInChores ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
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

      {/* Room Scanning (Parent only) */}
      {isParent && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-700">Scan Rooms</h3>
            <p className="text-sm text-gray-500">Add new rooms to generate chore suggestions</p>
          </div>
          <div className="p-4 space-y-3">
            {houseDetails.scanned_rooms && houseDetails.scanned_rooms.length > 0 && (
              <div className="space-y-2">
                {houseDetails.scanned_rooms.map((room, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                    <span className="font-medium text-gray-900">{room.name}</span>
                    <span className="text-xs text-gray-500">{room.assets?.length || 0} items detected</span>
                  </div>
                ))}
              </div>
            )}
            <label className={`flex items-center justify-center gap-2 py-3 border-2 border-dashed rounded-xl cursor-pointer transition text-sm font-medium ${isAnalyzing ? 'border-primary-400 text-primary-600' : 'border-gray-300 text-gray-500 hover:border-primary-400 hover:text-primary-600'}`}>
              {isAnalyzing ? <><Loader2 size={16} className="animate-spin" /> Analyzing...</> : <><Camera size={16} /> Scan a Room</>}
              <input type="file" accept="image/*" capture="environment" onChange={handleScanRoom} className="hidden" disabled={isAnalyzing} />
            </label>
          </div>
        </div>
      )}

      {/* Bin Schedule (Parent only) */}
      {isParent && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <button onClick={() => setShowBinEditor(!showBinEditor)} className="w-full p-4 border-b bg-gray-50 flex items-center justify-between">
            <div className="text-left">
              <h3 className="font-semibold text-gray-700">Bin Collection Schedule</h3>
              <p className="text-sm text-gray-500">{binDays.length > 0 ? binDays.map(d => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(', ') : 'Not set'}</p>
            </div>
            {showBinEditor ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
          </button>
          {showBinEditor && (
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-2">Collection Days</label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map(day => (
                    <button key={day} type="button" onClick={() => toggleDay(day, binDays, setBinDays)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${binDays.includes(day) ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-2">Rotation (children take turns weekly)</label>
                <div className="flex flex-wrap gap-2">
                  {children.map((c: any) => (
                    <button key={c.user_id} type="button" onClick={() => toggleChild(c.user_id, binRotationChildren, setBinRotationChildren)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${binRotationChildren.includes(c.user_id) ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {c.first_name || c.nickname}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleSaveBins} disabled={loading} className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
                {loading ? 'Saving...' : 'Save Bin Schedule'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pet Care (Parent only) */}
      {isParent && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <button onClick={() => setShowPetEditor(!showPetEditor)} className="w-full p-4 border-b bg-gray-50 flex items-center justify-between">
            <div className="text-left">
              <h3 className="font-semibold text-gray-700">Pet Care</h3>
              <p className="text-sm text-gray-500">{(houseDetails.pets || []).length} pets</p>
            </div>
            {showPetEditor ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
          </button>
          {showPetEditor && (
            <div className="p-4 space-y-4">
              {(houseDetails.pets || []).map(pet => (
                <div key={pet.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{pet.name} <span className="text-xs text-gray-500">({pet.type})</span></p>
                    {pet.walk_rotation_children && <p className="text-xs text-gray-500">Walk rotation: {pet.walk_rotation_children.length} children</p>}
                    {pet.litter_rotation_children && <p className="text-xs text-gray-500">Litter rotation: {pet.litter_rotation_children.length} children</p>}
                  </div>
                  <button onClick={() => handleDeletePet(pet.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
              ))}
              <div className="border-t pt-3 space-y-3">
                <p className="text-xs font-medium text-gray-500 uppercase">Add Pet</p>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={petName} onChange={e => setPetName(e.target.value)} placeholder="Pet name" className="px-3 py-2 border rounded-lg text-sm" />
                  <select value={petType} onChange={e => setPetType(e.target.value as any)} className="px-3 py-2 border rounded-lg text-sm bg-white">
                    <option value="dog">Dog</option><option value="cat">Cat</option><option value="other">Other</option>
                  </select>
                </div>
                {petType === 'dog' && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Who walks the dog? (rotation)</label>
                    <div className="flex flex-wrap gap-2">
                      {children.filter((c: any) => (c.age || 0) >= 10).map((c: any) => (
                        <button key={c.user_id} type="button" onClick={() => toggleChild(c.user_id, petWalkChildren, setPetWalkChildren)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${petWalkChildren.includes(c.user_id) ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                          {c.first_name || c.nickname}
                        </button>
                      ))}
                      {children.filter((c: any) => (c.age || 0) >= 10).length === 0 && <p className="text-xs text-gray-400">No children age 10+ for dog walking</p>}
                    </div>
                  </div>
                )}
                {petType === 'cat' && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Who cleans the litter? (daily rotation)</label>
                    <div className="flex flex-wrap gap-2">
                      {children.map((c: any) => (
                        <button key={c.user_id} type="button" onClick={() => toggleChild(c.user_id, petLitterChildren, setPetLitterChildren)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${petLitterChildren.includes(c.user_id) ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                          {c.first_name || c.nickname}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <button onClick={handleAddPet} disabled={loading || !petName.trim()} className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
                  {loading ? 'Adding...' : 'Add Pet'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gaming Schedule (Parent only) */}
      {isParent && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <button onClick={() => setShowGamingEditor(!showGamingEditor)} className="w-full p-4 border-b bg-gray-50 flex items-center justify-between">
            <div className="text-left">
              <h3 className="font-semibold text-gray-700">Gaming Schedule</h3>
              <p className="text-sm text-gray-500">{Object.keys(houseDetails.gaming_schedule || {}).length > 0 ? 'Configured' : 'Not set'}</p>
            </div>
            {showGamingEditor ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
          </button>
          {showGamingEditor && (
            <div className="p-4 space-y-4">
              {/* Show existing rules */}
              {Object.entries(houseDetails.gaming_schedule || {}).map(([childId, config]) => {
                const child = children.find((c: any) => c.user_id === childId) as any;
                return (
                  <div key={childId}>
                    <p className="text-sm font-semibold text-gray-700 mb-2">{child?.first_name || child?.firstName || child?.nickname || 'Unknown'}</p>
                    <div className="space-y-1">
                      {(config as any).rules?.map((rule: GamingRule, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs">
                          <span><span className="font-medium uppercase">{rule.device}</span> — {rule.days.map(d => d.slice(0, 3)).join(', ')} — {rule.hours}hr</span>
                          <button onClick={() => handleDeleteGamingRule(childId, idx)} className="text-gray-400 hover:text-red-600"><Trash2 size={12} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              <div className="border-t pt-3 space-y-3">
                <p className="text-xs font-medium text-gray-500 uppercase">Add Gaming Rule</p>
                <div className="grid grid-cols-3 gap-2">
                  <select value={gamingChildId} onChange={e => setGamingChildId(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white">
                    <option value="">Child</option>
                    {children.map((c: any) => <option key={c.user_id} value={c.user_id}>{c.first_name || c.nickname}</option>)}
                  </select>
                  <select value={gamingDevice} onChange={e => setGamingDevice(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white">
                    <option value="pc">PC</option><option value="vr">VR</option><option value="console">Console</option><option value="tablet">Tablet</option>
                  </select>
                  <input type="number" min="0.5" max="8" step="0.5" value={gamingHours} onChange={e => setGamingHours(parseFloat(e.target.value))} className="px-3 py-2 border rounded-lg text-sm" placeholder="Hours" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Allowed Days</label>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map(day => (
                      <button key={day} type="button" onClick={() => toggleDay(day, gamingDays, setGamingDays)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${gamingDays.includes(day) ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={handleAddGamingRule} disabled={loading || !gamingChildId || gamingDays.length === 0} className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
                  {loading ? 'Adding...' : 'Add Rule'}
                </button>
              </div>
            </div>
          )}
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
              <button onClick={() => setShowAddChild(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleAddChild} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" value={childName} onChange={(e) => setChildName(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input type="number" min="1" max="18" value={childAge} onChange={(e) => setChildAge(parseInt(e.target.value))} className="w-full px-4 py-2 border rounded-lg" required />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-primary-600 text-white py-2 rounded-lg font-semibold disabled:opacity-50">
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
              <button onClick={() => setShowAddReward(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleAddReward} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reward Name</label>
                <input type="text" value={rewardName} onChange={(e) => setRewardName(e.target.value)} placeholder="e.g., 30 min extra screen time" className="w-full px-4 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" value={rewardDesc} onChange={(e) => setRewardDesc(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <select value={rewardChildId} onChange={(e) => setRewardChildId(e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-white">
                  <option value="">All Children</option>
                  {children.map((child: any) => (
                    <option key={child.user_id} value={child.user_id}>{child.first_name || child.nickname}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Choose a specific child or leave as "All Children"</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Point Cost</label>
                <input type="number" min="1" value={rewardCost} onChange={(e) => setRewardCost(parseInt(e.target.value))} className="w-full px-4 py-2 border rounded-lg" required />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-primary-600 text-white py-2 rounded-lg font-semibold disabled:opacity-50">
                {loading ? 'Adding...' : 'Add Reward'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Reward Modal */}
      {editingReward && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Reward</h3>
              <button onClick={() => setEditingReward(null)}><X size={24} /></button>
            </div>
            <form onSubmit={handleEditReward} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reward Name</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <select value={editChildId} onChange={(e) => setEditChildId(e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-white">
                  <option value="">All Children</option>
                  {children.map((child: any) => (
                    <option key={child.user_id} value={child.user_id}>{child.first_name || child.nickname}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Choose a specific child or leave as "All Children"</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Point Cost</label>
                <input type="number" min="1" value={editCost} onChange={(e) => setEditCost(parseInt(e.target.value))} className="w-full px-4 py-2 border rounded-lg" required />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-primary-600 text-white py-2 rounded-lg font-semibold disabled:opacity-50">
                {loading ? 'Saving...' : 'Save Changes'}
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
              <button onClick={() => setShowAddChore(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleAddChore} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chore Name</label>
                <input type="text" value={choreName} onChange={(e) => setChoreName(e.target.value)} placeholder="e.g., Make bed" className="w-full px-4 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" value={choreDesc} onChange={(e) => setChoreDesc(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                  <select value={choreFrequency} onChange={(e) => setChoreFrequency(e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-white">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                  <select value={choreDifficulty} onChange={(e) => setChoreDifficulty(e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-white">
                    <option value="easy">Rookie (10 pts)</option>
                    <option value="medium">Pro (15 pts)</option>
                    <option value="hard">Legend (25 pts)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                <input type="number" min="1" value={chorePoints} onChange={(e) => setChorePoints(parseInt(e.target.value))} className="w-full px-4 py-2 border rounded-lg" required />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-primary-600 text-white py-2 rounded-lg font-semibold disabled:opacity-50">
                {loading ? 'Adding...' : 'Add Chore'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Invitation Link Modal */}
      {showInviteModal && invitationLink && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Invite {invitationLink.childName}</h3>
              <button onClick={() => { setShowInviteModal(false); setInvitationLink(null); setCopied(false); }}>
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-primary-50 rounded-xl p-4 text-center">
                <Link className="text-primary-600 mx-auto mb-2" size={32} />
                <p className="text-sm text-gray-600 mb-2">
                  Share this link with {invitationLink.childName} so they can create their login:
                </p>
              </div>

              <div className="flex gap-2">
                <input type="text" value={getInviteUrl()} readOnly className="flex-1 px-3 py-2 bg-gray-50 border rounded-lg text-sm text-gray-600" />
                <button
                  onClick={handleCopyLink}
                  className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition ${
                    copied ? 'bg-green-500 text-white' : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {copied ? (<><Check size={18} />Copied!</>) : (<><Copy size={18} />Copy</>)}
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                This link expires in 7 days. {invitationLink.childName} will need to set up an email and password.
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <strong>Tip:</strong> You can share this link via text message, email, or any messaging app.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
