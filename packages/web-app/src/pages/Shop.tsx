import { useEffect, useState } from 'react';
import { Star, ShoppingBag, Sparkles, Check, AlertCircle, Plus, Edit3, Trash2, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import api from '../services/api';
import { Reward } from '../types';

export default function Shop() {
  const { user, family, points, setPoints } = useStore();
  const isParent = user?.role === 'parent';
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [boughtId, setBoughtId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Parent management state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCost, setFormCost] = useState(50);
  const [formChildId, setFormChildId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const children = family?.members?.filter((m: any) => m.role === 'child') || [];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user?.userId || !family?.familyId) return;
    try {
      if (isParent) {
        const data = await api.getRewards(family.familyId);
        setRewards(data);
      } else {
        const [rewardsData, pointsData] = await Promise.all([
          api.getRewards(family.familyId),
          api.getUserPoints(user.userId),
        ]);
        setRewards(rewardsData.filter((r: Reward) => !r.childId || r.childId === user.userId));
        setPoints(pointsData.points);
      }
    } catch (err) {
      console.error('Error loading shop:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (reward: Reward) => {
    if (!user?.userId || points < reward.pointCost) return;
    setBuyingId(reward.rewardId);
    setError('');
    try {
      await api.redeemReward(user.userId, reward.rewardId);
      setPoints(points - reward.pointCost);
      setBoughtId(reward.rewardId);
      setTimeout(() => setBoughtId(null), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to redeem reward');
    } finally {
      setBuyingId(null);
    }
  };

  // Parent form handlers
  const resetForm = () => {
    setFormName(''); setFormDesc(''); setFormCost(50); setFormChildId('');
    setShowAddForm(false); setEditingId(null);
  };

  const handleAddReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family?.familyId) return;
    setActionLoading(true);
    try {
      await api.createReward({ family_id: family.familyId, reward_name: formName, description: formDesc, point_cost: formCost, child_id: formChildId || null });
      resetForm();
      await loadData();
    } catch { setError('Failed to add reward'); }
    finally { setActionLoading(false); }
  };

  const handleEditReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setActionLoading(true);
    try {
      await api.updateReward(editingId, { reward_name: formName, description: formDesc, point_cost: formCost, child_id: formChildId || null });
      resetForm();
      await loadData();
    } catch { setError('Failed to update reward'); }
    finally { setActionLoading(false); }
  };

  const handleDeleteReward = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try { await api.deleteReward(id); await loadData(); } catch { setError('Failed to delete'); }
  };

  const startEdit = (r: Reward) => {
    setEditingId(r.rewardId);
    setFormName(r.rewardName); setFormDesc(r.description || '');
    setFormCost(r.pointCost); setFormChildId(r.childId || '');
    setShowAddForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // ─── Parent Management View ───
  if (isParent) {
    const isFormOpen = showAddForm || !!editingId;

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 text-white">
          <h1 className="text-2xl font-bold flex items-center gap-2"><ShoppingBag size={24} /> Rewards Shop Manager</h1>
          <p className="text-indigo-200 mt-1">Add, edit, and manage rewards your kids can buy with their points</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle size={16} />{error}
            <button onClick={() => setError('')} className="ml-auto"><X size={14} /></button>
          </div>
        )}

        {!isFormOpen && (
          <button onClick={() => setShowAddForm(true)} className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary-400 hover:text-primary-600 transition text-sm font-medium">
            <Plus size={16} /> Add New Reward
          </button>
        )}

        {/* Inline form — NOT a sub-component, so inputs stay stable */}
        {isFormOpen && (
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h3 className="font-semibold text-gray-900 mb-3">{editingId ? 'Edit Reward' : 'Add Reward'}</h3>
            <form onSubmit={editingId ? handleEditReward : handleAddReward} className="space-y-3">
              <input type="text" value={formName} onChange={e => setFormName(e.target.value)}
                placeholder="Reward name (e.g., 30 min Screen Time)"
                className="w-full px-4 py-2.5 border rounded-lg text-sm" required autoComplete="off" />
              <input type="text" value={formDesc} onChange={e => setFormDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full px-4 py-2.5 border rounded-lg text-sm" autoComplete="off" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Point Cost</label>
                  <input type="number" min="1" value={formCost} onChange={e => setFormCost(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 border rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Available To</label>
                  <select value={formChildId} onChange={e => setFormChildId(e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-lg text-sm bg-white">
                    <option value="">All Children</option>
                    {children.map((c: any) => (
                      <option key={c.user_id || c.userId} value={c.user_id || c.userId}>
                        {c.first_name || c.firstName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={resetForm}
                  className="flex-1 border py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={actionLoading}
                  className="flex-1 bg-primary-600 text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50">
                  {actionLoading ? 'Saving...' : editingId ? 'Save Changes' : 'Add Reward'}
                </button>
              </div>
            </form>
          </div>
        )}

        {rewards.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <ShoppingBag className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500">No rewards yet. Add some for your kids!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rewards.map(r => (
              <div key={r.rewardId} className="bg-white rounded-xl shadow-sm border p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{r.rewardName}</p>
                  {r.description && <p className="text-xs text-gray-500 truncate">{r.description}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-1 text-xs text-yellow-600 font-medium">
                      <Star size={12} /> {r.pointCost} pts
                    </span>
                    <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                      {r.childName ? `${r.childName} only` : 'All kids'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 ml-2 shrink-0">
                  <button onClick={() => startEdit(r)} className="p-2 text-gray-400 hover:text-primary-600 rounded-lg"><Edit3 size={14} /></button>
                  <button onClick={() => handleDeleteReward(r.rewardId, r.rewardName)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── Child Shop View ───
  return (
    <div className="space-y-6">
      {/* Galaxy header with points */}
      <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white" style={{
              width: `${Math.random() * 3 + 1}px`, height: `${Math.random() * 3 + 1}px`,
              left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.7 + 0.3,
              animation: `twinkle ${Math.random() * 3 + 2}s infinite ${Math.random() * 2}s`,
            }} />
          ))}
        </div>
        <style>{`@keyframes twinkle { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 1; transform: scale(1.5); } }`}</style>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={20} className="text-yellow-300" style={{ filter: 'drop-shadow(0 0 6px rgba(250,204,21,0.6))' }} />
            <h1 className="text-xl font-bold">Rewards Shop</h1>
          </div>
          <p className="text-purple-200 text-sm mb-4">Spend your hard-earned stars!</p>
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center" style={{ boxShadow: '0 0 20px rgba(250,204,21,0.4)' }}>
              <Star size={24} className="text-yellow-900" />
            </div>
            <div>
              <p className="text-purple-200 text-xs">Your Balance</p>
              <p className="text-3xl font-bold text-yellow-300" style={{ textShadow: '0 0 10px rgba(250,204,21,0.3)' }}>
                {points}<span className="text-sm font-normal text-purple-300 ml-1">pts</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {rewards.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <ShoppingBag className="mx-auto text-gray-300 mb-4" size={64} />
          <h2 className="text-xl font-semibold text-gray-900">No rewards yet</h2>
          <p className="text-gray-500 mt-2">Ask your parents to add some rewards!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rewards.map(reward => {
            const canAfford = points >= reward.pointCost;
            const isBuying = buyingId === reward.rewardId;
            const justBought = boughtId === reward.rewardId;

            return (
              <div key={reward.rewardId} className={`relative bg-white rounded-xl shadow-sm border p-5 transition ${
                justBought ? 'border-green-400 bg-green-50' : canAfford ? 'hover:border-purple-300 hover:shadow-md' : 'opacity-70'
              }`}>
                {justBought && (
                  <div className="absolute inset-0 flex items-center justify-center bg-green-50/90 rounded-xl z-10">
                    <div className="flex items-center gap-2 text-green-600 font-bold">
                      <Check size={24} /> Purchased!
                    </div>
                  </div>
                )}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{reward.rewardName}</h3>
                  <div className="flex items-center gap-1 bg-gradient-to-r from-purple-900 to-indigo-900 text-yellow-300 px-2.5 py-1 rounded-full text-xs font-bold" style={{ boxShadow: '0 0 8px rgba(139,92,246,0.3)' }}>
                    <Star size={12} style={{ filter: 'drop-shadow(0 0 3px rgba(250,204,21,0.8))' }} /> {reward.pointCost}
                  </div>
                </div>
                {reward.description && <p className="text-sm text-gray-500 mb-4">{reward.description}</p>}
                <button onClick={() => handleBuy(reward)} disabled={!canAfford || isBuying}
                  className={`w-full py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 ${
                    canAfford ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  } disabled:opacity-60`}>
                  {isBuying ? 'Buying...' : canAfford ? <><ShoppingBag size={16} /> Buy</> : <>Need {reward.pointCost - points} more pts</>}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
