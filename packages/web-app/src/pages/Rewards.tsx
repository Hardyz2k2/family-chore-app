import { useEffect, useState } from 'react';
import { Gift, Star, TrendingUp, CheckCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import api from '../services/api';
import { Reward } from '../types';

export default function Rewards() {
  const { user, family, points, setPoints, rewards, setRewards } = useStore();
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    if (!family?.familyId || !user?.userId) return;
    try {
      const [rewardsData, pointsData] = await Promise.all([
        api.getRewards(family.familyId),
        api.getUserPoints(user.userId),
      ]);
      setRewards(rewardsData);
      setPoints(pointsData.points);
    } catch (error) {
      console.error('Error loading rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (reward: Reward) => {
    if (points < reward.pointCost) {
      alert(`You need ${reward.pointCost - points} more points to redeem this reward.`);
      return;
    }

    if (!confirm(`Redeem "${reward.rewardName}" for ${reward.pointCost} points?`)) {
      return;
    }

    setRedeeming(reward.rewardId);
    try {
      const result = await api.redeemReward(user!.userId, reward.rewardId);
      setPoints(result.new_point_balance);
      alert(`You've redeemed: ${reward.rewardName}`);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to redeem reward');
    } finally {
      setRedeeming(null);
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
      {/* Points Balance */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-white text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Star size={32} className="text-yellow-300" />
          <Star size={40} className="text-yellow-300" />
          <Star size={32} className="text-yellow-300" />
        </div>
        <p className="text-primary-100">Your Points</p>
        <p className="text-5xl font-bold mt-2">{points}</p>
      </div>

      {/* Rewards Grid */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Available Rewards</h2>
        {rewards.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <Gift className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-lg font-semibold text-gray-900">No rewards available yet</h3>
            <p className="text-gray-500 mt-2">Ask your parents to add some rewards!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((reward) => {
              const canAfford = points >= reward.pointCost;
              const isRedeeming = redeeming === reward.rewardId;

              return (
                <div
                  key={reward.rewardId}
                  className={`bg-white rounded-xl shadow-sm border p-6 ${
                    !canAfford ? 'opacity-60' : ''
                  }`}
                >
                  <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                    <Gift className={canAfford ? 'text-primary-600' : 'text-gray-400'} size={32} />
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 text-center">
                    {reward.rewardName}
                  </h3>

                  {reward.description && (
                    <p className="text-sm text-gray-500 text-center mt-2">{reward.description}</p>
                  )}

                  <div className="flex items-center justify-center gap-1 mt-4">
                    <Star className={canAfford ? 'text-yellow-500' : 'text-gray-300'} size={20} />
                    <span className="text-lg font-bold text-gray-900">{reward.pointCost}</span>
                    <span className="text-gray-500">points</span>
                  </div>

                  {!canAfford && (
                    <p className="text-sm text-red-500 text-center mt-2">
                      Need {reward.pointCost - points} more points
                    </p>
                  )}

                  <button
                    onClick={() => handleRedeem(reward)}
                    disabled={!canAfford || isRedeeming}
                    className={`w-full mt-4 py-3 rounded-lg font-semibold transition ${
                      canAfford
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isRedeeming ? 'Redeeming...' : canAfford ? 'Redeem' : 'Not enough points'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
        <h3 className="font-semibold text-green-800 flex items-center gap-2">
          <TrendingUp size={20} />
          How to Earn More Points
        </h3>
        <ul className="mt-3 space-y-2 text-green-700">
          <li className="flex items-center gap-2">
            <CheckCircle size={16} />
            Complete your daily chores on time
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle size={16} />
            Maintain your chore streak for bonus points
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle size={16} />
            Take on harder chores for more points
          </li>
        </ul>
      </div>
    </div>
  );
}
