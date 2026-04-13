import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, CheckCircle, Clock, Trophy, TrendingUp, Users, Send, AlertCircle, Shield, Award } from 'lucide-react';
import { getDifficultyLabel, getDifficultyStyle } from '../utils/difficulty';
import { useStore } from '../store/useStore';
import api from '../services/api';
import { AssignedChore, Badge } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, family, chores, setChores, points, setPoints, leaderboard, setLeaderboard } = useStore();
  const [loading, setLoading] = useState(true);
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);
  const [badges, setBadges] = useState<Badge[]>([]);

  const isParent = user?.role === 'parent';
  const today = new Date().toISOString().split('T')[0];
  const todayChores = chores.filter((c) => c.dueDate === today);
  const pendingChores = todayChores.filter((c) => c.status === 'pending' || c.status === 'in_progress');
  const completedToday = todayChores.filter((c) => c.status === 'completed' || c.status === 'approved');

  // For parent: group today's chores by child
  const choresByChild = isParent
    ? todayChores.reduce((groups, chore) => {
        const name = chore.firstName || 'Unassigned';
        if (!groups[name]) groups[name] = [];
        groups[name].push(chore);
        return groups;
      }, {} as Record<string, AssignedChore[]>)
    : {};

  const children = family?.members?.filter((m) => m.role === 'child') || [];

  // Get badge for a specific user
  const getBadgeForUser = (userId: string) => badges.find(b => b.userId === userId);
  // Get badge by name (for leaderboard which doesn't have userId matching easily)
  const getBadgeByName = (name: string) => badges.find(b => b.firstName === name);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user?.userId) return;

    try {
      if (isParent && family?.familyId) {
        const [choresData, leaderboardData, approvalsData, badgesData] = await Promise.all([
          api.getChoresForFamily(family.familyId),
          api.getLeaderboard(family.familyId),
          api.getPendingApprovals(family.familyId),
          api.getBadges(family.familyId),
        ]);
        setChores(choresData);
        setLeaderboard(leaderboardData);
        setPendingApprovalCount(approvalsData.length);
        setBadges(badgesData);
      } else if (family?.familyId) {
        const [choresData, pointsData, leaderboardData, badgesData] = await Promise.all([
          api.getChoresForUser(user.userId),
          api.getUserPoints(user.userId),
          api.getLeaderboard(family.familyId),
          api.getBadges(family.familyId),
        ]);
        setChores(choresData);
        setPoints(pointsData.points);
        setLeaderboard(leaderboardData);
        setBadges(badgesData);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Badge component
  const BadgeDisplay = ({ badge }: { badge?: Badge }) => {
    if (!badge) return null;
    const hasBadge = badge.weeklySuperstar || badge.monthlyHero;
    if (!hasBadge) return null;

    return (
      <div className="flex items-center gap-1 flex-wrap">
        {badge.weeklySuperstar && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 border border-gray-300 shadow-sm">
            <Shield size={10} className="text-gray-500" />
            Weekly Superstar
          </span>
        )}
        {badge.monthlyHero && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-yellow-200 to-yellow-400 text-yellow-900 border border-yellow-400 shadow-sm">
            <Award size={10} className="text-yellow-700" />
            Monthly Hero
          </span>
        )}
      </div>
    );
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
      {/* Welcome */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">
          Hello, {user?.firstName}! {user?.emoji}
        </h1>
        <p className="text-primary-100 mt-1">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        {/* Show child's own badges */}
        {!isParent && user?.userId && (() => {
          const myBadge = getBadgeForUser(user.userId);
          if (!myBadge || (!myBadge.weeklySuperstar && !myBadge.monthlyHero)) return null;
          return (
            <div className="mt-3 flex flex-wrap gap-2">
              {myBadge.weeklySuperstar && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30">
                  <Shield size={12} />
                  Weekly Superstar
                </span>
              )}
              {myBadge.monthlyHero && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-400/30 text-yellow-100 border border-yellow-300/40">
                  <Award size={12} />
                  Monthly Hero
                </span>
              )}
            </div>
          );
        })()}
      </div>

      {/* Invite Children Card (Parent only, when uninvited children exist) */}
      {isParent && children.filter((c: any) => !c.hasAccount).length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
          <div className="flex items-start gap-3">
            <Users className="text-amber-600 mt-0.5 shrink-0" size={22} />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900">Invite your children</h3>
              <p className="text-sm text-amber-700 mt-1">
                Send invite links so {children.filter((c: any) => !c.hasAccount).map((c: any) => c.firstName || c.nickname).join(', ')} can log in and see their chores.
              </p>
              <button
                onClick={() => navigate('/settings')}
                className="mt-3 flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition text-sm font-medium"
              >
                <Send size={16} />
                Go to Settings to Invite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Points Card (Child only) → tap goes to Shop */}
        {!isParent && (
          <div
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:border-yellow-300 transition"
            onClick={() => navigate('/shop')}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Star className="text-yellow-500" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Your Points</p>
                <p className="text-3xl font-bold text-gray-900">{points}</p>
              </div>
            </div>
          </div>
        )}

        {/* Pending Approvals (Parent only) */}
        {isParent && (
          <div
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:border-primary-200 transition"
            onClick={() => navigate('/approvals')}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="text-blue-500" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending Approvals</p>
                <p className="text-3xl font-bold text-gray-900">{pendingApprovalCount}</p>
              </div>
            </div>
          </div>
        )}

        {/* Today's Progress → tap goes to chores filtered to completed */}
        <div
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:border-green-300 transition"
          onClick={() => navigate('/chores?filter=completed')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="text-green-500" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed Today</p>
              <p className="text-3xl font-bold text-gray-900">
                {completedToday.length}/{todayChores.length}
              </p>
            </div>
          </div>
        </div>

        {/* Pending → tap goes to chores filtered to pending */}
        <div
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:border-orange-300 transition"
          onClick={() => navigate('/chores?filter=pending')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Clock className="text-orange-500" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Still To Do</p>
              <p className="text-3xl font-bold text-gray-900">{pendingChores.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Chores */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              {isParent ? "Today's Family Chores" : "Today's Chores"}
            </h2>
          </div>
          <div className="p-6">
            {isParent ? (
              Object.keys(choresByChild).length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto text-green-500 mb-3" size={48} />
                  <p className="text-gray-500">No chores scheduled for today</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {Object.entries(choresByChild).map(([childName, childChores]) => (
                    <div key={childName}>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm font-semibold text-primary-600">{childName}</h3>
                        <BadgeDisplay badge={getBadgeByName(childName)} />
                      </div>
                      <div className="space-y-2">
                        {childChores.map((chore) => (
                          <div
                            key={chore.assignedChoreId}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  chore.status === 'approved'
                                    ? 'bg-green-500'
                                    : chore.status === 'completed'
                                    ? 'bg-blue-500'
                                    : chore.status === 'in_progress'
                                    ? 'bg-orange-500'
                                    : 'bg-gray-300'
                                }`}
                              />
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{chore.choreName}</p>
                                <p className="text-xs text-gray-500">{chore.status.replace('_', ' ')}</p>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">{chore.points} pts</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              pendingChores.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto text-green-500 mb-3" size={48} />
                  <p className="text-gray-500">All caught up for today!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingChores.slice(0, 5).map((chore) => (
                    <div
                      key={chore.assignedChoreId}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{chore.choreName}</p>
                        <p className="text-sm text-gray-500">{chore.points} points</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyStyle(chore.difficulty)}`}>
                        {getDifficultyLabel(chore.difficulty)}
                      </span>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Trophy className="text-yellow-500" size={20} />
              Family Leaderboard
            </h2>
          </div>
          <div className="p-6">
            {leaderboard.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No data yet</p>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((member, index) => (
                  <div
                    key={member.userId}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition"
                    onClick={() => navigate('/rewards')}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${
                        index === 0
                          ? 'bg-yellow-400 text-yellow-900'
                          : index === 1
                          ? 'bg-gray-300 text-gray-700'
                          : index === 2
                          ? 'bg-orange-300 text-orange-900'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {member.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <BadgeDisplay badge={getBadgeByName(member.name)} />
                    </div>
                    <div className="flex items-center gap-1 text-primary-600 font-semibold shrink-0">
                      <Star size={16} />
                      {member.points}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Tips (Child only) */}
      {!isParent && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
          <h3 className="font-semibold text-green-800 flex items-center gap-2">
            <TrendingUp size={20} />
            Tips to Earn More Points
          </h3>
          <ul className="mt-3 space-y-2 text-green-700">
            <li className="flex items-center gap-2">
              <CheckCircle size={16} />
              Complete chores on time for full points
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle size={16} />
              Complete all daily chores every day to earn the silver Weekly Superstar badge
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle size={16} />
              Keep it up all month to earn the gold Monthly Hero badge
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
