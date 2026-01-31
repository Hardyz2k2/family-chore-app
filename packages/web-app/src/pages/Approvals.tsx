import { useEffect, useState } from 'react';
import { CheckCircle, X, Star, Clock, User } from 'lucide-react';
import { useStore } from '../store/useStore';
import api from '../services/api';

export default function Approvals() {
  const { family, pendingApprovals, setPendingApprovals } = useStore();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    if (!family?.familyId) return;
    try {
      const data = await api.getPendingApprovals(family.familyId);
      setPendingApprovals(data);
    } catch (error) {
      console.error('Error loading approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (assignedChoreId: string, choreName: string, points: number) => {
    if (!confirm(`Approve "${choreName}" and award ${points} points?`)) return;

    setProcessing(assignedChoreId);
    try {
      await api.approveChore(assignedChoreId);
      await loadApprovals();
      alert(`Approved! ${points} points awarded.`);
    } catch (error) {
      alert('Failed to approve chore');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (assignedChoreId: string, choreName: string) => {
    if (!confirm(`Reject "${choreName}"? The child will need to redo it.`)) return;

    setProcessing(assignedChoreId);
    try {
      await api.updateChoreStatus(assignedChoreId, 'rejected');
      await loadApprovals();
    } catch (error) {
      alert('Failed to reject chore');
    } finally {
      setProcessing(null);
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
        <p className="text-gray-500 mt-1">
          {pendingApprovals.length} chore{pendingApprovals.length !== 1 ? 's' : ''} awaiting review
        </p>
      </div>

      {pendingApprovals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
          <h2 className="text-xl font-semibold text-gray-900">All Caught Up!</h2>
          <p className="text-gray-500 mt-2">No chores waiting for approval</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingApprovals.map((chore) => {
            const isProcessing = processing === chore.assignedChoreId;

            return (
              <div
                key={chore.assignedChoreId}
                className="bg-white rounded-xl shadow-sm border p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="text-primary-600" size={24} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{chore.firstName || 'Child'}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock size={14} />
                        Completed {new Date(chore.completedAt || '').toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full">
                    <Star className="text-yellow-600" size={16} />
                    <span className="font-semibold text-yellow-800">{chore.points}</span>
                  </div>
                </div>

                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900">{chore.choreName}</h3>
                  {chore.description && (
                    <p className="text-sm text-gray-500 mt-1">{chore.description}</p>
                  )}
                </div>

                {chore.proofImageUrl && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-2">Proof Photo:</p>
                    <img
                      src={chore.proofImageUrl}
                      alt="Proof"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => handleReject(chore.assignedChoreId, chore.choreName)}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition disabled:opacity-50"
                  >
                    <X size={20} />
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(chore.assignedChoreId, chore.choreName, chore.points)}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
                  >
                    <CheckCircle size={20} />
                    {isProcessing ? 'Processing...' : 'Approve'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
        <h3 className="font-semibold text-blue-800">Tips for Approving Chores</h3>
        <ul className="mt-3 space-y-2 text-blue-700 text-sm">
          <li className="flex items-center gap-2">
            <CheckCircle size={16} />
            Review proof photos when available
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle size={16} />
            Give specific praise when approving
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle size={16} />
            Explain why when rejecting to help them improve
          </li>
        </ul>
      </div>
    </div>
  );
}
