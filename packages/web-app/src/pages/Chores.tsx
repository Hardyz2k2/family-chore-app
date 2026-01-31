import { useEffect, useState } from 'react';
import { CheckCircle, Clock, Play, Check, X, Star, Filter } from 'lucide-react';
import { useStore } from '../store/useStore';
import api from '../services/api';
import { AssignedChore } from '../types';

type FilterType = 'all' | 'pending' | 'completed';

export default function Chores() {
  const { user, chores, setChores } = useStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChores();
  }, []);

  const loadChores = async () => {
    if (!user?.userId) return;
    try {
      const data = await api.getChoresForUser(user.userId);
      setChores(data);
    } catch (error) {
      console.error('Error loading chores:', error);
    } finally {
      setLoading(false);
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
      await loadChores();
    } catch (error) {
      console.error('Error completing chore:', error);
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Chores</h1>
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
          <p className="text-gray-500 mt-2">You're all caught up!</p>
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
                          </div>
                          <div className="flex items-center gap-1 text-yellow-600">
                            <Star size={16} />
                            <span className="font-semibold">{chore.points}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4">
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

                          <div className="flex gap-2">
                            {chore.status === 'pending' && (
                              <button
                                onClick={() => handleStartChore(chore)}
                                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
                              >
                                <Play size={16} />
                                Start
                              </button>
                            )}
                            {chore.status === 'in_progress' && (
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
    </div>
  );
}
