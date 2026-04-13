import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, Clock, Play, Check, X, Star, User, Plus, Zap, Sparkles, ArrowRightLeft, HeartHandshake } from 'lucide-react';
import { getDifficultyLabel, getDifficultyStyle } from '../utils/difficulty';
import { useStore } from '../store/useStore';
import api from '../services/api';
import { AssignedChore } from '../types';

type FilterType = 'all' | 'pending' | 'completed';

interface ExtraChore {
  choreId: string;
  choreName: string;
  description?: string;
  difficulty: string;
  points: number;
}

export default function Chores() {
  const [searchParams] = useSearchParams();
  const { user, family, chores, setChores } = useStore();
  const initialFilter = (searchParams.get('filter') as FilterType) || 'all';
  const [filter, setFilter] = useState<FilterType>(initialFilter);
  const [loading, setLoading] = useState(true);
  const [extraChores, setExtraChores] = useState<ExtraChore[]>([]);
  const [showExtras, setShowExtras] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [starBurst, setStarBurst] = useState<string | null>(null);
  const [transferModal, setTransferModal] = useState<{ choreId: string; type: 'transfer' | 'support' } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isParent = user?.role === 'parent';
  const siblings = family?.members?.filter((m: any) => m.role === 'child' && (m.user_id || m.userId) !== user?.userId) || [];

  useEffect(() => {
    loadChores();
    if (!isParent && user?.userId) {
      loadExtraChores();
    }
  }, []);

  const loadChores = async () => {
    if (!user?.userId) return;
    try {
      let data: AssignedChore[];
      if (isParent && family?.familyId) {
        data = await api.getChoresForFamily(family.familyId);
      } else {
        data = await api.getChoresForUser(user.userId);
      }
      setChores(data);
    } catch (error) {
      console.error('Error loading chores:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExtraChores = async () => {
    if (!user?.userId) return;
    try {
      const data = await api.getExtraChores(user.userId);
      setExtraChores(data);
    } catch (error) {
      console.error('Error loading extra chores:', error);
    }
  };

  const handleStartChore = async (chore: AssignedChore) => {
    try {
      await api.updateChoreStatus(chore.assignedChoreId, 'in_progress');
      await loadChores();
    } catch (error) {
      console.error('Error starting chore:', error);
    }
  };

  const handleCompleteChore = async (chore: AssignedChore) => {
    try {
      await api.updateChoreStatus(chore.assignedChoreId, 'completed');
      // Trigger star animation
      setStarBurst(chore.assignedChoreId);
      setTimeout(() => setStarBurst(null), 1200);
      await loadChores();
    } catch (error) {
      console.error('Error completing chore:', error);
    }
  };

  const handleTransfer = async (assignedChoreId: string, toUserId: string) => {
    setActionLoading(assignedChoreId);
    try {
      await api.transferChore(assignedChoreId, toUserId);
      setTransferModal(null);
      await loadChores();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Transfer failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestSupport = async (assignedChoreId: string, helperUserId: string) => {
    setActionLoading(assignedChoreId);
    try {
      await api.requestSupport(assignedChoreId, helperUserId);
      setTransferModal(null);
      await loadChores();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Support request failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClaimExtra = async (choreId: string) => {
    if (!user?.userId) return;
    setClaimingId(choreId);
    try {
      await api.claimExtraChore(user.userId, choreId);
      await Promise.all([loadChores(), loadExtraChores()]);
    } catch (error) {
      console.error('Error claiming extra chore:', error);
    } finally {
      setClaimingId(null);
    }
  };

  const filteredChores = chores.filter((chore) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return chore.status === 'pending' || chore.status === 'in_progress';
    if (filter === 'completed') return chore.status === 'completed' || chore.status === 'approved';
    return true;
  });

  const groupedChores = filteredChores.reduce((groups, chore) => {
    const date = chore.dueDate;
    if (!groups[date]) groups[date] = [];
    groups[date].push(chore);
    return groups;
  }, {} as Record<string, AssignedChore[]>);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateStr === today.toISOString().split('T')[0]) return 'Today';
    if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Tomorrow';

    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-gray-400" size={20} />;
      case 'in_progress':
        return <Play className="text-orange-500" size={20} />;
      case 'completed':
        return <Clock className="text-blue-500" size={20} />;
      case 'approved':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'rejected':
        return <X className="text-red-500" size={20} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Star burst animation overlay */}
      {starBurst && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: '50%',
                top: '40%',
                animation: `starfly-${i % 4} 1s ease-out forwards`,
              }}
            >
              <Sparkles size={16} className="text-yellow-400" style={{ filter: 'drop-shadow(0 0 4px rgba(250,204,21,0.8))' }} />
            </div>
          ))}
          <style>{`
            @keyframes starfly-0 { 0% { transform: translate(0,0) scale(1); opacity:1; } 100% { transform: translate(-80px,-120px) scale(0.3); opacity:0; } }
            @keyframes starfly-1 { 0% { transform: translate(0,0) scale(1); opacity:1; } 100% { transform: translate(60px,-140px) scale(0.3); opacity:0; } }
            @keyframes starfly-2 { 0% { transform: translate(0,0) scale(1); opacity:1; } 100% { transform: translate(-40px,-100px) scale(0.3); opacity:0; } }
            @keyframes starfly-3 { 0% { transform: translate(0,0) scale(1); opacity:1; } 100% { transform: translate(90px,-110px) scale(0.3); opacity:0; } }
          `}</style>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {isParent ? 'Family Chores' : 'My Chores'}
        </h1>
        <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border">
          {(['all', 'pending', 'completed'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                filter === f
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {Object.keys(groupedChores).length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
          <h2 className="text-xl font-semibold text-gray-900">No chores found</h2>
          <p className="text-gray-500 mt-2">
            {isParent
              ? 'No chores have been assigned yet. Go to Settings to add chores and redistribute.'
              : "You're all caught up!"}
          </p>
        </div>
      ) : (
        Object.entries(groupedChores)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, dateChores]) => (
            <div key={date}>
              <h2 className="text-sm font-semibold text-gray-500 mb-3">{formatDate(date)}</h2>
              <div className="space-y-3">
                {dateChores.map((chore) => (
                  <div
                    key={chore.assignedChoreId}
                    className="bg-white rounded-xl shadow-sm border p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-1">{getStatusIcon(chore.status)}</div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{chore.choreName}</h3>
                            {chore.description && (
                              <p className="text-sm text-gray-500 mt-1">{chore.description}</p>
                            )}
                            {isParent && chore.firstName && (
                              <div className="flex items-center gap-1 mt-1.5">
                                <User size={14} className="text-primary-500" />
                                <span className="text-sm text-primary-600 font-medium">
                                  {chore.firstName}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-yellow-600">
                            <Star size={16} style={{ filter: 'drop-shadow(0 0 3px rgba(250,204,21,0.5))' }} />
                            <span className="font-semibold">{chore.points}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyStyle(chore.difficulty)}`}>
                            {getDifficultyLabel(chore.difficulty)}
                          </span>

                          <div className="flex gap-2 flex-wrap">
                            {!isParent && chore.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleStartChore(chore)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-xs font-medium"
                                >
                                  <Play size={14} />
                                  Start
                                </button>
                                {siblings.length > 0 && (
                                  <>
                                    <button
                                      onClick={() => setTransferModal({ choreId: chore.assignedChoreId, type: 'transfer' })}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition text-xs font-medium"
                                    >
                                      <ArrowRightLeft size={14} />
                                      Transfer
                                    </button>
                                    <button
                                      onClick={() => setTransferModal({ choreId: chore.assignedChoreId, type: 'support' })}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-xs font-medium"
                                    >
                                      <HeartHandshake size={14} />
                                      Help
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                            {!isParent && chore.status === 'in_progress' && (
                              <button
                                onClick={() => handleCompleteChore(chore)}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                              >
                                <Check size={16} />
                                Complete
                              </button>
                            )}
                            {chore.status === 'completed' && (
                              <span className="text-sm text-blue-600 font-medium">
                                Awaiting approval
                              </span>
                            )}
                            {chore.status === 'approved' && (
                              <span className="text-sm text-green-600 font-medium">
                                Approved!
                              </span>
                            )}
                            {isParent && (chore.status === 'pending' || chore.status === 'in_progress') && (
                              <span className="text-sm text-gray-500 font-medium">
                                {chore.status === 'pending' ? 'Not started' : 'In progress'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
      )}

      {/* Extra Chores Section (Child only) */}
      {!isParent && extraChores.length > 0 && (
        <div>
          <button
            onClick={() => setShowExtras(!showExtras)}
            className="w-full flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-200 hover:border-purple-300 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Zap className="text-purple-600" size={20} />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-purple-900">Earn More Points!</h3>
                <p className="text-sm text-purple-600">{extraChores.length} extra chores available</p>
              </div>
            </div>
            <Plus size={20} className={`text-purple-600 transition-transform ${showExtras ? 'rotate-45' : ''}`} />
          </button>

          {showExtras && (
            <div className="mt-3 space-y-2">
              {extraChores.map((chore) => (
                <div key={chore.choreId} className="bg-white rounded-xl shadow-sm border p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-sm">{chore.choreName}</h3>
                    {chore.description && (
                      <p className="text-xs text-gray-500">{chore.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getDifficultyStyle(chore.difficulty)}`}>{getDifficultyLabel(chore.difficulty)}</span>
                      <span className="flex items-center gap-0.5 text-xs text-yellow-600 font-medium">
                        <Star size={12} style={{ filter: 'drop-shadow(0 0 2px rgba(250,204,21,0.5))' }} />
                        {chore.points} pts
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleClaimExtra(chore.choreId)}
                    disabled={claimingId === chore.choreId}
                    className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium disabled:opacity-50"
                  >
                    {claimingId === chore.choreId ? (
                      <span>Adding...</span>
                    ) : (
                      <>
                        <Plus size={14} />
                        Claim
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Transfer / Support Modal */}
      {transferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {transferModal.type === 'transfer' ? 'Transfer Chore' : 'Ask for Help'}
              </h3>
              <button onClick={() => setTransferModal(null)}><X size={24} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {transferModal.type === 'transfer'
                ? 'The other person gets the chore and ALL the points.'
                : 'You both work on it and SPLIT the points 50/50.'}
            </p>
            <div className="space-y-2">
              {siblings.map((s: any) => (
                <button
                  key={s.user_id || s.userId}
                  onClick={() => {
                    const targetId = s.user_id || s.userId;
                    if (transferModal.type === 'transfer') {
                      handleTransfer(transferModal.choreId, targetId);
                    } else {
                      handleRequestSupport(transferModal.choreId, targetId);
                    }
                  }}
                  disabled={actionLoading === transferModal.choreId}
                  className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
                >
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
                    {(s.first_name || s.firstName)?.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 text-sm">{s.first_name || s.firstName || s.nickname}</p>
                    <p className="text-xs text-gray-500">
                      {transferModal.type === 'transfer' ? 'Transfer to' : 'Ask for help from'} {s.first_name || s.firstName}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
