import { useEffect, useState } from 'react';
import { Star, Trophy, Flame, Sparkles, Award, Target, TrendingUp } from 'lucide-react';
import { useStore } from '../store/useStore';
import api from '../services/api';
import { Badge } from '../types';

interface UserStats {
  totalCompleted: number;
  weekCompleted: number;
  streak: number;
  totalPoints: number;
}

// Achievement badges based on weekly chore count
const WEEKLY_BADGES = [
  { min: 1, label: 'Getting Started!', emoji: '🌱', description: 'Completed your first chore this week' },
  { min: 3, label: 'On a Roll!', emoji: '🎯', description: '3 chores done this week' },
  { min: 5, label: 'Hard Worker!', emoji: '💪', description: '5 chores smashed this week' },
  { min: 7, label: 'Super Helper!', emoji: '🦸', description: '7 chores completed this week' },
  { min: 10, label: "You're Cooking!", emoji: '👨‍🍳', description: '10 chores done - the kitchen is yours!' },
  { min: 14, label: 'Chore Champion!', emoji: '🏆', description: '14 chores - unstoppable!' },
];

// Streak badges
const STREAK_BADGES = [
  { min: 1, label: 'Warm Up', emoji: '🔥', color: 'text-orange-400' },
  { min: 3, label: 'On Fire!', emoji: '🔥🔥', color: 'text-orange-500' },
  { min: 7, label: 'Blazing!', emoji: '🔥🔥🔥', color: 'text-red-500' },
  { min: 14, label: 'Inferno!', emoji: '☄️', color: 'text-red-600' },
  { min: 30, label: 'Legendary!', emoji: '⭐', color: 'text-yellow-500' },
];

export default function Rewards() {
  const { user, family } = useStore();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  const isParent = user?.role === 'parent';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user?.userId || !family?.familyId) return;
    try {
      if (isParent) {
        const badgesData = await api.getBadges(family.familyId);
        setBadges(badgesData);
      } else {
        const [statsData, badgesData] = await Promise.all([
          api.getUserStats(user.userId),
          api.getBadges(family.familyId),
        ]);
        setStats(statsData);
        setBadges(badgesData);
      }
    } catch (error) {
      console.error('Error loading rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeeklyBadge = (count: number) => {
    let badge = WEEKLY_BADGES[0];
    for (const b of WEEKLY_BADGES) {
      if (count >= b.min) badge = b;
    }
    return count >= 1 ? badge : null;
  };

  const getStreakBadge = (streak: number) => {
    let badge = STREAK_BADGES[0];
    for (const b of STREAK_BADGES) {
      if (streak >= b.min) badge = b;
    }
    return streak >= 1 ? badge : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Parent view: show all children's badges
  if (isParent) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 15 }).map((_, i) => (
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
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="text-yellow-300" size={24} />
              Family Achievements
            </h1>
            <p className="text-purple-200 mt-1">See how everyone is doing</p>
          </div>
        </div>

        {badges.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No badge data yet</p>
        ) : (
          <div className="space-y-4">
            {badges.map((badge) => (
              <div key={badge.userId} className="bg-white rounded-xl shadow-sm border p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-lg">
                    {badge.firstName?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{badge.firstName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {badge.weeklySuperstar && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 border border-gray-300">
                          🛡️ Weekly Superstar
                        </span>
                      )}
                      {badge.monthlyHero && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-yellow-200 to-yellow-400 text-yellow-900 border border-yellow-400">
                          🏅 Monthly Hero
                        </span>
                      )}
                      {!badge.weeklySuperstar && !badge.monthlyHero && (
                        <span className="text-xs text-gray-400">Keep going!</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Child view
  const weeklyBadge = stats ? getWeeklyBadge(stats.weekCompleted) : null;
  const streakBadge = stats ? getStreakBadge(stats.streak) : null;
  const myBadge = badges.find(b => b.userId === user?.userId);

  return (
    <div className="space-y-6">
      {/* Galaxy header */}
      <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 25 }).map((_, i) => (
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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="text-yellow-300" size={24} style={{ filter: 'drop-shadow(0 0 8px rgba(250,204,21,0.6))' }} />
            My Achievements
          </h1>
          <p className="text-purple-200 mt-1">Your journey to greatness</p>

          {myBadge && (myBadge.weeklySuperstar || myBadge.monthlyHero) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {myBadge.weeklySuperstar && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-white border border-white/20">
                  🛡️ Weekly Superstar
                </span>
              )}
              {myBadge.monthlyHero && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-400/20 text-yellow-200 border border-yellow-300/30">
                  🏅 Monthly Hero
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-4 border border-yellow-200 text-center">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center" style={{ boxShadow: '0 0 12px rgba(250,204,21,0.3)' }}>
            <Star size={20} className="text-yellow-900" />
          </div>
          <p className="text-2xl font-bold text-yellow-800">{stats?.totalPoints || 0}</p>
          <p className="text-[10px] text-yellow-600 font-medium uppercase tracking-wide">Total Points</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200 text-center">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center" style={{ boxShadow: '0 0 12px rgba(249,115,22,0.3)' }}>
            <Flame size={20} className="text-white" />
          </div>
          <p className="text-2xl font-bold text-orange-800">{stats?.streak || 0}</p>
          <p className="text-[10px] text-orange-600 font-medium uppercase tracking-wide">Day Streak</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 text-center">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center" style={{ boxShadow: '0 0 12px rgba(34,197,94,0.3)' }}>
            <Target size={20} className="text-white" />
          </div>
          <p className="text-2xl font-bold text-green-800">{stats?.totalCompleted || 0}</p>
          <p className="text-[10px] text-green-600 font-medium uppercase tracking-wide">All Time</p>
        </div>
      </div>

      {/* Weekly Chores Badge */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Award size={18} className="text-purple-500" />
            This Week's Progress
          </h2>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-3xl font-bold text-gray-900">{stats?.weekCompleted || 0}</p>
              <p className="text-sm text-gray-500">chores completed this week</p>
            </div>
            {weeklyBadge && (
              <div className="text-center">
                <div className="text-4xl mb-1">{weeklyBadge.emoji}</div>
                <p className="text-xs font-bold text-purple-600">{weeklyBadge.label}</p>
              </div>
            )}
          </div>

          {stats && (() => {
            const currentIdx = WEEKLY_BADGES.findIndex(b => b.min > stats.weekCompleted);
            const nextBadge = currentIdx >= 0 ? WEEKLY_BADGES[currentIdx] : null;
            const prevMin = currentIdx > 0 ? WEEKLY_BADGES[currentIdx - 1].min : 0;
            const progress = nextBadge
              ? ((stats.weekCompleted - prevMin) / (nextBadge.min - prevMin)) * 100
              : 100;

            return nextBadge ? (
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{stats.weekCompleted} done</span>
                  <span>{nextBadge.min} for "{nextBadge.label}" {nextBadge.emoji}</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-green-600 font-medium text-center">Max badge reached! Amazing!</p>
            );
          })()}

          <div className="mt-5 grid grid-cols-3 gap-2">
            {WEEKLY_BADGES.map((badge) => {
              const earned = (stats?.weekCompleted || 0) >= badge.min;
              return (
                <div key={badge.min} className={`text-center p-2.5 rounded-lg transition ${
                  earned ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50 border border-gray-100 opacity-40'
                }`}>
                  <div className="text-2xl mb-1">{badge.emoji}</div>
                  <p className={`text-[10px] font-bold ${earned ? 'text-purple-700' : 'text-gray-400'}`}>{badge.label}</p>
                  <p className="text-[9px] text-gray-400">{badge.min}+ chores</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Streak Section */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Flame size={18} className="text-orange-500" />
            Chore Streak
          </h2>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {stats?.streak || 0}
                <span className="text-lg text-gray-400 ml-1">days</span>
              </p>
              <p className="text-sm text-gray-500">consecutive days with all chores done</p>
            </div>
            {streakBadge && (
              <div className="text-center">
                <div className="text-3xl mb-1">{streakBadge.emoji}</div>
                <p className={`text-xs font-bold ${streakBadge.color}`}>{streakBadge.label}</p>
              </div>
            )}
          </div>

          <div className="flex gap-1 justify-center">
            {Array.from({ length: 7 }).map((_, i) => {
              const active = i < (stats?.streak || 0);
              return (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                    active
                      ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white font-bold shadow-sm'
                      : 'bg-gray-100 text-gray-300'
                  }`}
                  style={active ? { boxShadow: '0 0 8px rgba(249,115,22,0.3)' } : {}}
                >
                  {active ? <Flame size={16} /> : (i + 1)}
                </div>
              );
            })}
            {(stats?.streak || 0) > 7 && (
              <div className="flex items-center text-sm text-orange-600 font-bold ml-1">
                +{(stats?.streak || 0) - 7}
              </div>
            )}
          </div>

          {(stats?.streak || 0) === 0 && (
            <p className="text-center text-gray-400 text-sm mt-3">
              Complete all your chores today to start a streak!
            </p>
          )}
        </div>
      </div>

      {/* Total Points Section */}
      <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-6 border border-yellow-200">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center" style={{ boxShadow: '0 0 20px rgba(250,204,21,0.4)' }}>
            <Star size={28} className="text-yellow-900" />
          </div>
          <div>
            <p className="text-sm text-yellow-700 font-medium">Total Points Earned</p>
            <p className="text-4xl font-bold text-yellow-900" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
              {stats?.totalPoints || 0}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 text-yellow-700 text-sm">
          <TrendingUp size={16} />
          <span>{stats?.weekCompleted || 0} chores done this week</span>
        </div>
      </div>
    </div>
  );
}
