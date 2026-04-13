import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Mail, Lock, Loader2, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import api from '../services/api';
import { useStore } from '../store/useStore';

export default function JoinFamily() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { setUser, setFamily } = useStore();

  const [validating, setValidating] = useState(true);
  const [invitation, setInvitation] = useState<{
    valid: boolean;
    child_name: string;
    family_name: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link');
      setValidating(false);
      return;
    }

    validateInvitation();
  }, [token]);

  const validateInvitation = async () => {
    try {
      const result = await api.validateInvitation(token!);
      setInvitation(result);
      setError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Invalid invitation link';
      setError(errorMessage);
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);

    try {
      const result = await api.claimInvitation(token!, { email, password });

      // Store auth token
      localStorage.setItem('authToken', result.token);

      // Set user in store
      setUser({
        userId: result.user_id,
        email: result.email,
        firstName: invitation?.child_name || '',
        lastName: '',
        role: 'child',
      });

      setSuccess(true);

      // Get user profile to get family info
      try {
        const profile = await api.getProfile();
        if (profile.family_id) {
          const familyDetails = await api.getFamilyDetails(profile.family_id);
          setFamily({
            familyId: familyDetails.family_id,
            familyName: familyDetails.family_name,
            members: familyDetails.members,
          });
        }
      } catch {
        // Ignore errors getting family details
      }

      // Redirect to dashboard after showing success
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to create account';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Loader2 className="animate-spin text-primary-600 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-semibold text-gray-900">Validating invitation...</h2>
        </div>
      </div>
    );
  }

  // Error state (invalid/expired invitation)
  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-red-600" size={32} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Invitation</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500 mb-4">
            Please ask your parent to send you a new invitation link.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="text-primary-600 font-medium hover:underline"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome, {invitation?.child_name}!</h2>
          <p className="text-gray-600 mb-4">
            Your account is all set up. Taking you to your dashboard...
          </p>
          <Loader2 className="animate-spin text-primary-600 mx-auto" size={24} />
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="text-primary-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome, {invitation?.child_name}!
          </h1>
          <p className="text-gray-600">
            Join the <span className="font-semibold">{invitation?.family_name}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">You'll use this to log in</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Create a Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                required
                minLength={6}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Type password again"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Creating Account...
              </>
            ) : (
              <>
                <Users size={20} />
                Join Family
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-primary-600 font-medium hover:underline"
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}
