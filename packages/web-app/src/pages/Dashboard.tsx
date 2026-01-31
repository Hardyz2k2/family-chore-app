import { useEffect, useState } from 'react';
import { Star, CheckCircle, Clock, Trophy, TrendingUp } from 'lucide-react';
import { useStore } from '../store/useStore';
import api from '../services/api';

export default function Dashboard() {
  const { user, family, chores, setChores, points, setPoints, leaderboard, setLeaderboard } = useStore();
  const [loading, setLoading] = useState(true);

  const isParent = user?.role === 'parent';
  const today = new Date().toISOString().split('T')[0];
  const todayChores = chores.filter((c) => c.dueDate === today);
  const pendingChores = todayChores.filter((c) => c.status === 'pending' || c.status === 'in_progress');
  const completedToday = todayChores.filter((c) => c.status === 'completed' || c.status === 'approved');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user?.userId || !family?.familyId) return;

    try {
      const [choresData, pointsData, leaderboardData] = await Promise.all([
        api.getChoresForUser(user.userId),
        api.getUserPoints(user.userId),
        api.getLeaderboard(family.familyId),
      ]);

      setChores(choresData);
      setPoints(pointsData.points);
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
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
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Points Card */}
        {!isParent && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
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

        {/* Today's Progress */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
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

        {/* Pending */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
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
            <h2 className="text-lg font-semibold text-gray-900">Today's Chores</h2>
          </div>
          <div className="p-6">
            {pendingChores.length === 0 ? (
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
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        chore.difficulty === 'easy'
                          ? 'bg-green-100 text-green-700'
                          : chore.difficulty === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {chore.difficulty}
                    </span>
                  </div>
                ))}
              </div>
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
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
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
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{member.name}</p>
                    </div>
                    <div className="flex items-center gap-1 text-primary-600 font-semibold">
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

      {/* Quick Tips */}
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
            Take on harder chores for more rewards
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle size={16} />
            Help family members with their tasks
          </li>
        </ul>
      </div>
    </div>
  );
}
