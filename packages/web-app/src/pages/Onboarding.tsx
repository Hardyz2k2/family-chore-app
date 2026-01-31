import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Home, UserPlus, Check, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import api from '../services/api';

interface Child {
  name: string;
  age: number;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, setFamily } = useStore();
  const [step, setStep] = useState(1);
  const [familyName, setFamilyName] = useState('');
  const [houseType, setHouseType] = useState('');
  const [children, setChildren] = useState<Child[]>([{ name: '', age: 5 }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const houseTypes = [
    { value: 'house', label: 'House' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'condo', label: 'Condo' },
    { value: 'townhouse', label: 'Townhouse' },
  ];

  const addChild = () => {
    setChildren([...children, { name: '', age: 5 }]);
  };

  const removeChild = (index: number) => {
    setChildren(children.filter((_, i) => i !== index));
  };

  const updateChild = (index: number, field: 'name' | 'age', value: string | number) => {
    const updated = [...children];
    updated[index] = { ...updated[index], [field]: value };
    setChildren(updated);
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      // Create family
      const familyResponse = await api.createFamily({
        family_name: familyName,
        house_type: houseType,
      });

      // Add children
      for (const child of children) {
        if (child.name.trim()) {
          await api.addChild(familyResponse.family_id, {
            first_name: child.name,
            age: child.age,
          });
        }
      }

      // Distribute chores
      await api.distributeChores(familyResponse.family_id);

      // Get family details
      const familyDetails = await api.getFamilyDetails(familyResponse.family_id);
      setFamily({
        familyId: familyDetails.family_id,
        familyName: familyDetails.family_name,
        houseType,
        members: familyDetails.members,
      });

      // Update user in localStorage
      const updatedUser = { ...user, familyId: familyResponse.family_id };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create family. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  s <= step
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s < step ? <Check size={20} /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-20 h-1 ${
                    s < step ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          {/* Step 1: Family Name */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="text-primary-600" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Welcome!</h2>
                <p className="text-gray-500 mt-2">Let's set up your family</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Family Name
                </label>
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="e.g., The Smith Family"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!familyName.trim()}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: House Type */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Home className="text-primary-600" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Your Home</h2>
                <p className="text-gray-500 mt-2">What type of home do you live in?</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {houseTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setHouseType(type.value)}
                    className={`p-4 border-2 rounded-xl text-center transition ${
                      houseType === type.value
                        ? 'border-primary-600 bg-primary-50 text-primary-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-medium">{type.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 border border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!houseType}
                  className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Children */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="text-primary-600" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Add Your Children</h2>
                <p className="text-gray-500 mt-2">We'll assign age-appropriate chores</p>
              </div>

              <div className="space-y-4">
                {children.map((child, index) => (
                  <div key={index} className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={child.name}
                        onChange={(e) => updateChild(index, 'name', e.target.value)}
                        placeholder="Child's name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Age
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="18"
                        value={child.age}
                        onChange={(e) => updateChild(index, 'age', parseInt(e.target.value) || 5)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                      />
                    </div>
                    {children.length > 1 && (
                      <button
                        onClick={() => removeChild(index)}
                        className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={addChild}
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
              >
                <Plus size={20} />
                Add Another Child
              </button>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 border border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !children.some((c) => c.name.trim())}
                  className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Setting Up...' : 'Complete Setup'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
