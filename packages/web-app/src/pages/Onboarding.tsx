import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic, MicOff, Send, Camera, Upload, Volume2, VolumeX,
  Check, Loader2, AlertCircle, Sparkles, MessageCircle, X,
  Gift, Star, Users as UsersIcon, Trophy
} from 'lucide-react';
import { useStore } from '../store/useStore';
import api from '../services/api';
import { useSpeechRecognition, speak, stopSpeaking, initAudioElement } from '../hooks/useSpeechRecognition';

interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  text: string;
  timestamp: Date;
}

interface Child {
  name: string;
  age: number;
}

interface DetectedRoom {
  name: string;
  confidence: number;
  assets: string[];
  suggestedChores: string[];
}

interface ExtractedData {
  family_name: string | null;
  house_type: string | null;
  children: Child[];
}

interface RewardSuggestion {
  id: string;
  reward_name: string;
  description: string;
  point_cost: number;
  reward_type: 'daily' | 'weekly' | 'family_target';
  emoji: string;
}

type Phase = 'chat' | 'scanning' | 'rewards' | 'manual';

// ─── Reward Suggestions ───
const REWARD_SUGGESTIONS: RewardSuggestion[] = [
  // Daily rewards
  { id: 'd1', reward_name: '30 min Screen Time', description: '30 minutes of tablet, TV, or phone time', point_cost: 20, reward_type: 'daily', emoji: '📱' },
  { id: 'd2', reward_name: '30 min VR Time', description: '30 minutes of VR gaming or experiences', point_cost: 25, reward_type: 'daily', emoji: '🥽' },
  { id: 'd3', reward_name: '30 min Gaming Time', description: '30 minutes of console or PC gaming', point_cost: 20, reward_type: 'daily', emoji: '🎮' },
  { id: 'd4', reward_name: 'Outside Play Time', description: 'Extra 30 minutes of outdoor play', point_cost: 15, reward_type: 'daily', emoji: '🌳' },
  { id: 'd5', reward_name: 'Choose a Snack', description: 'Pick a special snack from the pantry', point_cost: 10, reward_type: 'daily', emoji: '🍪' },
  { id: 'd6', reward_name: 'Stay Up 15 min Late', description: 'Stay up 15 minutes past bedtime', point_cost: 25, reward_type: 'daily', emoji: '🌙' },
  { id: 'd7', reward_name: 'Pick the Music', description: "Choose the music for the car or house", point_cost: 10, reward_type: 'daily', emoji: '🎵' },
  // Weekly rewards
  { id: 'w1', reward_name: 'Chore Immunity Pass', description: 'Skip any one chore this week', point_cost: 80, reward_type: 'weekly', emoji: '🛡️' },
  { id: 'w2', reward_name: 'Extra Gaming Session', description: '1 hour bonus gaming session on the weekend', point_cost: 60, reward_type: 'weekly', emoji: '🕹️' },
  { id: 'w3', reward_name: 'Choose Dinner Menu', description: 'Pick what the family has for dinner one night', point_cost: 50, reward_type: 'weekly', emoji: '🍕' },
  { id: 'w4', reward_name: 'Movie Night Pick', description: 'Choose the movie for family movie night', point_cost: 40, reward_type: 'weekly', emoji: '🎬' },
  { id: 'w5', reward_name: 'Friend Sleepover', description: 'Have a friend over for a sleepover', point_cost: 100, reward_type: 'weekly', emoji: '🏠' },
  { id: 'w6', reward_name: 'Stay Up 30 min Late (Weekend)', description: 'Stay up 30 minutes late on Friday or Saturday', point_cost: 50, reward_type: 'weekly', emoji: '⭐' },
  { id: 'w7', reward_name: 'Pocket Money Bonus', description: 'Earn a small pocket money bonus', point_cost: 75, reward_type: 'weekly', emoji: '💰' },
  // Family target rewards
  { id: 'f1', reward_name: 'Family Night Out', description: 'The whole family goes out for dinner when everyone completes their chores', point_cost: 200, reward_type: 'family_target', emoji: '🍽️' },
  { id: 'f2', reward_name: 'Play Area / Fun Zone', description: 'Family trip to an indoor play area or fun zone', point_cost: 250, reward_type: 'family_target', emoji: '🎢' },
  { id: 'f3', reward_name: 'Cinema Trip', description: 'Family outing to the cinema with popcorn', point_cost: 200, reward_type: 'family_target', emoji: '🍿' },
  { id: 'f4', reward_name: 'Ice Cream Outing', description: 'Family trip to the ice cream shop', point_cost: 150, reward_type: 'family_target', emoji: '🍦' },
  { id: 'f5', reward_name: 'Park / Beach Day', description: 'Family day out at the park or beach', point_cost: 200, reward_type: 'family_target', emoji: '🏖️' },
  { id: 'f6', reward_name: 'Game Night Special', description: 'Special family board game night with treats', point_cost: 120, reward_type: 'family_target', emoji: '🎲' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, setFamily } = useStore();

  // Phase management
  const [phase, setPhase] = useState<Phase>('chat');

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [textInput, setTextInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTypingIndicator, setIsTypingIndicator] = useState(false);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Extracted data
  const [extractedData, setExtractedData] = useState<ExtractedData>({
    family_name: null,
    house_type: null,
    children: [],
  });

  // Scanning state
  const [detectedRooms, setDetectedRooms] = useState<DetectedRoom[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [, setScanningImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Rewards selection state
  const [selectedRewards, setSelectedRewards] = useState<Set<string>>(new Set());

  // Manual mode state
  const [manualStep, setManualStep] = useState(1);
  const [manualFamilyName, setManualFamilyName] = useState('');
  const [manualHouseType, setManualHouseType] = useState('');
  const [manualChildren, setManualChildren] = useState<Child[]>([{ name: '', age: 5 }]);

  // Submission state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const conversationStartedRef = useRef(false);
  const wasListeningRef = useRef(false);
  const pendingTranscriptRef = useRef('');
  const awaitingScanDecisionRef = useRef(false);

  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: speechSupported,
    isSpeechDetected,
  } = useSpeechRecognition({ silenceTimeout: 2000 });

  // Auto-scroll chat to bottom
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTypingIndicator, scrollToBottom]);

  // Store transcript in ref
  useEffect(() => {
    if (transcript) {
      pendingTranscriptRef.current = transcript;
    }
  }, [transcript]);

  // Track if speech ended while processing, so we can send it after
  const missedTranscriptRef = useRef('');

  // Detect when listening stops and process the transcript
  useEffect(() => {
    if (wasListeningRef.current && !isListening) {
      const textToProcess = pendingTranscriptRef.current || transcript;
      if (textToProcess?.trim()) {
        if (isProcessing) {
          missedTranscriptRef.current = textToProcess.trim();
        } else {
          handleSendMessage(textToProcess.trim());
          missedTranscriptRef.current = '';
        }
        pendingTranscriptRef.current = '';
      }
    }
    wasListeningRef.current = isListening;
  }, [isListening, isProcessing]);

  // Send any transcript that was captured while processing
  useEffect(() => {
    if (!isProcessing && missedTranscriptRef.current) {
      const text = missedTranscriptRef.current;
      missedTranscriptRef.current = '';
      handleSendMessage(text);
    }
  }, [isProcessing]);

  // Add a message to the chat
  const addMessage = useCallback((role: 'ai' | 'user', text: string) => {
    const msg: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role,
      text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, msg]);
    return msg;
  }, []);

  // Speak with TTS if enabled
  const speakIfEnabled = useCallback((text: string, autoListen = false) => {
    if (ttsEnabled) {
      setIsSpeaking(true);
      speak(text, () => {
        setIsSpeaking(false);
        if (autoListen && speechSupported && !isOnboardingComplete) {
          setTimeout(() => {
            resetTranscript();
            startListening();
          }, 400);
        }
      });
    } else if (autoListen && speechSupported && !isOnboardingComplete) {
      setTimeout(() => {
        resetTranscript();
        startListening();
      }, 400);
    }
  }, [ttsEnabled, speechSupported, isOnboardingComplete, resetTranscript, startListening]);

  // Start the AI conversation
  useEffect(() => {
    if (phase === 'chat' && !conversationStartedRef.current) {
      conversationStartedRef.current = true;
      startConversation();
    }
  }, [phase]);

  const startConversation = async () => {
    setIsTypingIndicator(true);
    try {
      const response = await api.processVoiceSetup(null, '');
      setSessionId(response.session_id);
      setIsTypingIndicator(false);
      addMessage('ai', response.message);
      speakIfEnabled(response.message, true);
      updateExtractedData(response.extracted_data);
    } catch {
      setIsTypingIndicator(false);
      const fallback = "Hi! I'm your family chore assistant. Let's get your family set up — are you a parent or guardian?";
      addMessage('ai', fallback);
      speakIfEnabled(fallback, true);
    }
  };

  // Update extracted data from AI response
  const updateExtractedData = (data: ExtractedData) => {
    setExtractedData(prev => ({
      family_name: data.family_name || prev.family_name,
      house_type: data.house_type || prev.house_type,
      children: data.children?.length > 0 ? data.children : prev.children,
    }));
  };

  // Navigate to rewards phase
  const goToRewards = () => {
    setPhase('rewards');
  };

  // Send a message (either typed or spoken)
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isProcessing) return;

    // If we're waiting for scan decision, handle it
    if (awaitingScanDecisionRef.current) {
      awaitingScanDecisionRef.current = false;
      addMessage('user', text);
      const lower = text.toLowerCase();
      if (lower.includes('yes') || lower.includes('yeah') || lower.includes('sure') || lower.includes('ok')) {
        setPhase('scanning');
        const scanMsg = "Let's scan your home! Upload a photo of any room and I'll identify it and suggest chores.";
        addMessage('ai', scanMsg);
        speakIfEnabled(scanMsg, false);
      } else {
        const skipMsg = "No problem! Let's pick some rewards for your family first.";
        addMessage('ai', skipMsg);
        speakIfEnabled(skipMsg, false);
        goToRewards();
      }
      return;
    }

    addMessage('user', text);
    setTextInput('');
    setIsProcessing(true);
    setIsTypingIndicator(true);
    resetTranscript();
    pendingTranscriptRef.current = '';

    try {
      const response = await api.processVoiceSetup(sessionId, text);

      if (response.session_id && !sessionId) {
        setSessionId(response.session_id);
      }

      updateExtractedData(response.extracted_data);
      setIsTypingIndicator(false);
      addMessage('ai', response.message);

      if (response.is_complete) {
        setIsOnboardingComplete(true);
        // After a beat, ask about scanning
        setTimeout(() => {
          awaitingScanDecisionRef.current = true;
          const scanQuestion = "Would you like to scan your rooms? Just upload photos and I'll detect what's in each room to suggest the right chores. Want to try it?";
          addMessage('ai', scanQuestion);
          speakIfEnabled(scanQuestion, true);
        }, 2500);
        speakIfEnabled(response.message, false);
      } else {
        speakIfEnabled(response.message, true);
      }
    } catch (err: any) {
      setIsTypingIndicator(false);
      let errorMsg: string;
      if (err?.code === 'ECONNABORTED') {
        errorMsg = "That took longer than expected — let's try again. What were you saying?";
      } else if (err?.response?.status >= 500) {
        errorMsg = "I'm having a technical hiccup — give me a moment and try again.";
      } else if (typeof navigator !== 'undefined' && !navigator.onLine) {
        errorMsg = "Looks like you're offline. Reconnect and I'll be right here!";
      } else {
        errorMsg = "Sorry, something went wrong. Could you say that again?";
      }
      addMessage('ai', errorMsg);
      speakIfEnabled(errorMsg, true);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle text input submission
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    initAudioElement();
    if (textInput.trim()) {
      handleSendMessage(textInput.trim());
    }
  };

  // Handle mic button
  const handleMicToggle = () => {
    initAudioElement();
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    }
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  // Image upload and analysis
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageData = event.target?.result as string;
      setScanningImage(imageData);
      await analyzeImage(imageData);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const analyzeImage = async (imageData: string) => {
    setIsAnalyzing(true);
    addMessage('user', '📷 [Uploaded a room photo]');
    setIsTypingIndicator(true);

    try {
      const response = await api.analyzeRoom(imageData);
      setIsTypingIndicator(false);

      if (response.rooms?.length > 0) {
        const newRooms: DetectedRoom[] = response.rooms.map((r: any) => ({
          name: r.name,
          confidence: r.confidence,
          assets: r.assets || [],
          suggestedChores: r.suggestedChores || [],
        }));

        setDetectedRooms(prev => {
          const existingNames = new Set(prev.map(r => r.name.toLowerCase()));
          const unique = newRooms.filter(r => !existingNames.has(r.name.toLowerCase()));
          return [...prev, ...unique];
        });

        const roomSummary = newRooms.map(r => {
          const assets = r.assets?.length > 0 ? ` (spotted: ${r.assets.slice(0, 3).join(', ')})` : '';
          return `${r.name}${assets}`;
        }).join(', ');

        const msg = `I detected: **${roomSummary}**. I've added chore suggestions for ${newRooms.length === 1 ? 'this room' : 'these rooms'}. Want to scan another room?`;
        addMessage('ai', msg);
        speakIfEnabled(msg.replace(/\*\*/g, ''), false);
      } else {
        const msg = "I couldn't clearly identify a room in that photo. Try a wider angle with better lighting.";
        addMessage('ai', msg);
        speakIfEnabled(msg, false);
      }
    } catch {
      setIsTypingIndicator(false);
      const msg = "Sorry, I had trouble analyzing that image. Please try another photo.";
      addMessage('ai', msg);
      speakIfEnabled(msg, false);
    } finally {
      setIsAnalyzing(false);
      setScanningImage(null);
    }
  };

  // Toggle a reward selection
  const toggleReward = (id: string) => {
    setSelectedRewards(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Final submission
  const handleSubmit = async (data?: ExtractedData, rooms?: DetectedRoom[]) => {
    const finalData = data || extractedData;
    const finalRooms = rooms || detectedRooms;
    setError('');
    setLoading(true);

    try {
      // Create family
      const familyResponse = await api.createFamily({
        family_name: finalData.family_name || 'My Family',
        house_type: finalData.house_type || 'house',
      });

      // Add children
      for (const child of finalData.children) {
        if (child.name?.trim()) {
          await api.addChild(familyResponse.family_id, {
            first_name: child.name,
            age: child.age,
          });
        }
      }

      // Add detected rooms and generate chores
      if (finalRooms.length > 0) {
        await api.addRoomsAndChores(familyResponse.family_id, finalRooms);
      }

      // Create selected rewards
      if (selectedRewards.size > 0) {
        const rewardsToCreate = REWARD_SUGGESTIONS
          .filter(r => selectedRewards.has(r.id))
          .map(r => ({
            reward_name: r.reward_name,
            description: r.description,
            point_cost: r.point_cost,
            reward_type: r.reward_type,
          }));
        await api.createRewardsBulk(familyResponse.family_id, rewardsToCreate);
      }

      // Distribute chores
      await api.distributeChores(familyResponse.family_id);

      // Get family details
      const familyDetails = await api.getFamilyDetails(familyResponse.family_id);
      setFamily({
        familyId: familyDetails.family_id,
        familyName: familyDetails.family_name,
        houseType: finalData.house_type || 'house',
        members: familyDetails.members,
      });

      // Update user in localStorage
      const updatedUser = { ...user, familyId: familyResponse.family_id };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      const rewardCount = selectedRewards.size;
      const doneMsg = `All set! I've created ${finalData.children.length} chore schedules${finalRooms.length > 0 ? ` based on your ${finalRooms.length} scanned rooms` : ''}${rewardCount > 0 ? ` and ${rewardCount} rewards` : ''}. Heading to your dashboard now!`;
      addMessage('ai', doneMsg);
      speakIfEnabled(doneMsg, false);
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create family. Please try again.');
      const errMsg = "There was an error setting up your family. Please try again.";
      addMessage('ai', errMsg);
      speakIfEnabled(errMsg, false);
    } finally {
      setLoading(false);
    }
  };

  // Handle manual mode submission
  const handleManualSubmit = () => {
    const data: ExtractedData = {
      family_name: manualFamilyName,
      house_type: manualHouseType,
      children: manualChildren.filter(c => c.name.trim()),
    };
    setExtractedData(data);
    handleSubmit(data, detectedRooms);
  };

  // Setup progress items
  const progressItems = [
    { label: 'Parent confirmed', done: messages.some(m => m.role === 'user') },
    { label: `Family: ${extractedData.family_name || '...'}`, done: !!extractedData.family_name },
    { label: `Home: ${extractedData.house_type || '...'}`, done: !!extractedData.house_type },
    { label: `Children: ${extractedData.children.length > 0 ? extractedData.children.map(c => c.name).join(', ') : '...'}`, done: extractedData.children.length > 0 },
  ];

  const hasAnyProgress = extractedData.family_name || extractedData.house_type || extractedData.children.length > 0;

  // ─── Rewards Selection Phase ───
  if (phase === 'rewards') {
    const dailyRewards = REWARD_SUGGESTIONS.filter(r => r.reward_type === 'daily');
    const weeklyRewards = REWARD_SUGGESTIONS.filter(r => r.reward_type === 'weekly');
    const familyRewards = REWARD_SUGGESTIONS.filter(r => r.reward_type === 'family_target');

    const categories = [
      {
        title: 'Daily Rewards',
        subtitle: 'Small rewards children can earn each day',
        icon: <Star className="text-yellow-500" size={22} />,
        color: 'yellow',
        rewards: dailyRewards,
      },
      {
        title: 'Weekly Rewards',
        subtitle: 'Bigger rewards for a great week',
        icon: <Trophy className="text-purple-500" size={22} />,
        color: 'purple',
        rewards: weeklyRewards,
      },
      {
        title: 'Family Target',
        subtitle: 'Everyone completes their chores to unlock these',
        icon: <UsersIcon className="text-blue-500" size={22} />,
        color: 'blue',
        rewards: familyRewards,
      },
    ];

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <Gift className="text-primary-600" size={20} />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900 text-sm">Choose Rewards</h1>
              <p className="text-xs text-gray-500">Tap to select rewards for your family</p>
            </div>
          </div>
          <span className="text-xs text-primary-600 font-medium bg-primary-50 px-3 py-1 rounded-full">
            {selectedRewards.size} selected
          </span>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 pb-32 space-y-8">
          <div className="text-center max-w-md mx-auto">
            <h2 className="text-xl font-bold text-gray-900">What should your kids work towards?</h2>
            <p className="text-sm text-gray-500 mt-2">
              Pick the rewards that motivate your children. You can always add more later in Settings.
            </p>
          </div>

          {categories.map((cat) => (
            <div key={cat.title}>
              <div className="flex items-center gap-2 mb-3">
                {cat.icon}
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{cat.title}</h3>
                  <p className="text-xs text-gray-500">{cat.subtitle}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {cat.rewards.map((reward) => {
                  const isSelected = selectedRewards.has(reward.id);
                  return (
                    <button
                      key={reward.id}
                      onClick={() => toggleReward(reward.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xl mt-0.5">{reward.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${isSelected ? 'text-primary-700' : 'text-gray-900'}`}>
                            {reward.reward_name}
                          </p>
                          {isSelected && (
                            <Check size={16} className="text-primary-600 shrink-0 ml-1" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{reward.description}</p>
                        <p className={`text-xs font-medium mt-1 ${isSelected ? 'text-primary-600' : 'text-gray-400'}`}>
                          {reward.point_cost} points
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom action bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 space-y-2" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {error && (
            <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle size={14} />
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => handleSubmit()}
              disabled={loading}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition disabled:opacity-50 text-sm"
            >
              Skip Rewards
            </button>
            <button
              onClick={() => handleSubmit()}
              disabled={loading || selectedRewards.size === 0}
              className="flex-1 bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Setting Up...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Continue ({selectedRewards.size})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Chat Interface (primary experience) ───
  if (phase === 'chat' || phase === 'scanning') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <Sparkles className="text-primary-600" size={20} />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900 text-sm">Family Setup Assistant</h1>
              <p className="text-xs text-gray-500">
                {phase === 'scanning' ? 'Room scanning mode' : isOnboardingComplete ? 'Setup complete' : 'Setting up your family'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* TTS toggle */}
            <button
              onClick={() => {
                initAudioElement();
                if (isSpeaking) { stopSpeaking(); setIsSpeaking(false); }
                setTtsEnabled(!ttsEnabled);
              }}
              className={`p-2 rounded-full transition ${ttsEnabled ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'}`}
              title={ttsEnabled ? 'Mute voice' : 'Unmute voice'}
            >
              {ttsEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            {/* Switch to manual */}
            <button
              onClick={() => {
                stopListening();
                stopSpeaking();
                setPhase('manual');
              }}
              className="text-xs text-gray-500 hover:text-gray-700 px-3 py-2 rounded-full hover:bg-gray-100 transition"
            >
              Form mode
            </button>
          </div>
        </header>

        {/* Chat messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] sm:max-w-[70%] ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white rounded-2xl rounded-br-md'
                  : 'bg-white text-gray-800 rounded-2xl rounded-bl-md shadow-sm border border-gray-100'
              } px-4 py-3`}>
                {msg.role === 'ai' && (
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={14} className="text-primary-500" />
                    <span className="text-xs font-medium text-primary-500">Assistant</span>
                  </div>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTypingIndicator && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl rounded-bl-md shadow-sm border border-gray-100 px-4 py-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Listening indicator */}
          {isListening && (
            <div className="flex justify-end">
              <div className="bg-red-50 border border-red-200 rounded-2xl rounded-br-md px-4 py-3 max-w-[85%] sm:max-w-[70%]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-xs text-red-600 font-medium">
                    {isSpeechDetected ? 'Hearing you...' : 'Listening...'}
                  </span>
                </div>
                {(interimTranscript || transcript) && (
                  <p className="text-sm text-red-800 mt-1">{interimTranscript || transcript}</p>
                )}
              </div>
            </div>
          )}

          {/* Detected rooms summary in scanning mode */}
          {phase === 'scanning' && detectedRooms.length > 0 && (
            <div className="flex justify-start">
              <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 w-full max-w-[85%] sm:max-w-[70%]">
                <p className="text-xs font-semibold text-green-700 mb-2">Scanned Rooms ({detectedRooms.length})</p>
                <div className="space-y-2">
                  {detectedRooms.map((room, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check size={14} className="text-green-600" />
                        <span className="text-sm text-green-800">{room.name}</span>
                      </div>
                      <span className="text-xs text-green-600">{room.suggestedChores.length} chores</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Analyzing indicator */}
          {isAnalyzing && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl rounded-bl-md shadow-sm border border-gray-100 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 size={16} className="text-primary-600 animate-spin" />
                  <span className="text-sm text-gray-600">Analyzing your room...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Setup progress card (collapsible) */}
        {hasAnyProgress && phase === 'chat' && (
          <div className="px-4 pb-2">
            <div className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-primary-700 mb-2">Setup Progress</p>
              <div className="flex flex-wrap gap-2">
                {progressItems.map((item, i) => (
                  <span
                    key={i}
                    className={`text-xs px-2 py-1 rounded-full ${
                      item.done
                        ? 'bg-primary-200 text-primary-800'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {item.done && <Check size={10} className="inline mr-1" />}
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="bg-white border-t border-gray-200 px-4 py-3 shrink-0">
          {error && (
            <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs mb-3 flex items-center gap-2">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Scanning controls */}
          {phase === 'scanning' && (
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
                className="flex-1 flex items-center justify-center gap-2 bg-primary-50 text-primary-700 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-100 transition disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Camera size={16} />
                )}
                {isAnalyzing ? 'Analyzing...' : 'Scan a Room'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                className="hidden"
              />
              {detectedRooms.length > 0 && (
                <button
                  onClick={goToRewards}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-700 transition disabled:opacity-50"
                >
                  <Check size={16} />
                  Done Scanning
                </button>
              )}
            </div>
          )}

          {phase === 'scanning' && detectedRooms.length === 0 && (
            <button
              onClick={goToRewards}
              disabled={loading}
              className="w-full text-xs text-gray-500 hover:text-gray-700 py-2 transition"
            >
              Skip scanning & continue
            </button>
          )}

          {/* Text + mic input */}
          {phase === 'chat' && !loading && (
            <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  ref={textInputRef}
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={isListening ? 'Listening...' : 'Type your response...'}
                  disabled={isProcessing || isListening}
                  className="w-full px-4 py-3 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition disabled:opacity-50"
                />
              </div>

              {/* Mic button */}
              {speechSupported && (
                <button
                  type="button"
                  onClick={handleMicToggle}
                  disabled={isProcessing}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition shrink-0 ${
                    isListening
                      ? 'bg-red-500 text-white shadow-lg shadow-red-200 animate-pulse'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  } disabled:opacity-50`}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
              )}

              {/* Send button */}
              <button
                type="submit"
                disabled={!textInput.trim() || isProcessing}
                className="w-11 h-11 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition disabled:opacity-30 shrink-0"
              >
                {isProcessing ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </form>
          )}

          {loading && phase === 'chat' && (
            <div className="flex items-center justify-center gap-2 py-3 text-primary-600">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Creating your family...</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Manual Form Mode (fallback) ───
  const houseTypes = [
    { value: 'house', label: 'House', icon: '🏠' },
    { value: 'apartment', label: 'Apartment', icon: '🏢' },
    { value: 'condo', label: 'Condo', icon: '🏬' },
    { value: 'townhouse', label: 'Townhouse', icon: '🏘️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Switch back to chat */}
        {speechSupported && (
          <div className="flex justify-center mb-6">
            <button
              onClick={() => setPhase('chat')}
              className="flex items-center gap-2 text-primary-600 hover:text-primary-700 bg-primary-50 px-4 py-2 rounded-full text-sm"
            >
              <MessageCircle size={16} />
              Switch to Chat Setup
            </button>
          </div>
        )}

        {/* Progress */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                s <= manualStep ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {s < manualStep ? <Check size={20} /> : s}
              </div>
              {s < 5 && <div className={`w-12 h-1 ${s < manualStep ? 'bg-primary-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-6 flex items-center gap-2">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {/* Step 1: Family Name */}
          {manualStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">Your Family</h2>
                <p className="text-gray-500 mt-2">What should we call your family?</p>
              </div>
              <input
                type="text"
                value={manualFamilyName}
                onChange={(e) => setManualFamilyName(e.target.value)}
                placeholder="e.g., The Smith Family"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
              <button
                onClick={() => setManualStep(2)}
                disabled={!manualFamilyName.trim()}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: House Type */}
          {manualStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">Your Home</h2>
                <p className="text-gray-500 mt-2">What type of home do you live in?</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {houseTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setManualHouseType(type.value)}
                    className={`p-4 border-2 rounded-xl text-center transition ${
                      manualHouseType === type.value
                        ? 'border-primary-600 bg-primary-50 text-primary-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{type.icon}</span>
                    <span className="font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-4">
                <button onClick={() => setManualStep(1)} className="flex-1 border border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50 transition">Back</button>
                <button onClick={() => setManualStep(3)} disabled={!manualHouseType} className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50">Continue</button>
              </div>
            </div>
          )}

          {/* Step 3: Children */}
          {manualStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">Your Children</h2>
                <p className="text-gray-500 mt-2">We'll assign age-appropriate chores</p>
              </div>
              <div className="space-y-4">
                {manualChildren.map((child, index) => (
                  <div key={index} className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={child.name}
                        onChange={(e) => {
                          const updated = [...manualChildren];
                          updated[index] = { ...updated[index], name: e.target.value };
                          setManualChildren(updated);
                        }}
                        placeholder="Child's name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                      <select
                        value={child.age}
                        onChange={(e) => {
                          const updated = [...manualChildren];
                          updated[index] = { ...updated[index], age: parseInt(e.target.value) };
                          setManualChildren(updated);
                        }}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
                      >
                        {Array.from({ length: 18 }, (_, i) => i + 1).map((age) => (
                          <option key={age} value={age}>{age}</option>
                        ))}
                      </select>
                    </div>
                    {manualChildren.length > 1 && (
                      <button
                        onClick={() => setManualChildren(manualChildren.filter((_, i) => i !== index))}
                        className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setManualChildren([...manualChildren, { name: '', age: 5 }])}
                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                + Add Another Child
              </button>
              <div className="flex gap-4">
                <button onClick={() => setManualStep(2)} className="flex-1 border border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50 transition">Back</button>
                <button onClick={() => setManualStep(4)} disabled={!manualChildren.some(c => c.name.trim())} className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50">
                  Scan Rooms
                </button>
              </div>
              <button
                onClick={() => setManualStep(5)}
                disabled={!manualChildren.some(c => c.name.trim())}
                className="w-full border border-primary-600 text-primary-600 py-3 rounded-lg font-semibold hover:bg-primary-50 transition disabled:opacity-50"
              >
                Skip Scanning
              </button>
            </div>
          )}

          {/* Step 4: Room Scanning (manual mode) */}
          {manualStep === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="text-primary-600" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Scan Your Home</h2>
                <p className="text-gray-500 mt-2">Upload room photos to auto-detect chores</p>
              </div>

              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary-500 transition"
                onClick={() => fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
                {isAnalyzing ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="text-primary-600 animate-spin mb-4" size={48} />
                    <p className="text-gray-600">Analyzing room with AI...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="text-gray-400 mx-auto mb-4" size={48} />
                    <p className="text-gray-600 font-medium">Tap to upload or take a photo</p>
                    <p className="text-gray-400 text-sm mt-1">Supports JPG, PNG</p>
                  </>
                )}
              </div>

              {detectedRooms.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700">Detected Rooms</h3>
                  {detectedRooms.map((room, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{room.name}</span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          {Math.round(room.confidence * 100)}%
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {room.suggestedChores.map((chore, cIdx) => (
                          <span key={cIdx} className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">{chore}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-4">
                <button onClick={() => setManualStep(3)} className="flex-1 border border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50 transition">Back</button>
                <button
                  onClick={() => setManualStep(5)}
                  className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
                >
                  Next: Choose Rewards
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Rewards Selection (manual mode) */}
          {manualStep === 5 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="text-yellow-600" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Choose Rewards</h2>
                <p className="text-gray-500 mt-2">What should your kids work towards?</p>
              </div>

              {/* Daily Rewards */}
              <div>
                <h3 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                  <Star size={16} className="text-yellow-500" /> Daily Rewards
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {REWARD_SUGGESTIONS.filter(r => r.reward_type === 'daily').map((reward) => {
                    const isSelected = selectedRewards.has(reward.id);
                    return (
                      <button
                        key={reward.id}
                        onClick={() => toggleReward(reward.id)}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 text-left text-sm transition ${
                          isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span>{reward.emoji}</span>
                        <span className={`flex-1 ${isSelected ? 'text-primary-700 font-medium' : 'text-gray-700'}`}>{reward.reward_name}</span>
                        {isSelected && <Check size={14} className="text-primary-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Weekly Rewards */}
              <div>
                <h3 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                  <Trophy size={16} className="text-purple-500" /> Weekly Rewards
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {REWARD_SUGGESTIONS.filter(r => r.reward_type === 'weekly').map((reward) => {
                    const isSelected = selectedRewards.has(reward.id);
                    return (
                      <button
                        key={reward.id}
                        onClick={() => toggleReward(reward.id)}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 text-left text-sm transition ${
                          isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span>{reward.emoji}</span>
                        <span className={`flex-1 ${isSelected ? 'text-primary-700 font-medium' : 'text-gray-700'}`}>{reward.reward_name}</span>
                        {isSelected && <Check size={14} className="text-primary-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Family Target Rewards */}
              <div>
                <h3 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                  <UsersIcon size={16} className="text-blue-500" /> Family Targets
                </h3>
                <p className="text-xs text-gray-500 mb-2">Everyone completes their chores to unlock these</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {REWARD_SUGGESTIONS.filter(r => r.reward_type === 'family_target').map((reward) => {
                    const isSelected = selectedRewards.has(reward.id);
                    return (
                      <button
                        key={reward.id}
                        onClick={() => toggleReward(reward.id)}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 text-left text-sm transition ${
                          isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span>{reward.emoji}</span>
                        <span className={`flex-1 ${isSelected ? 'text-primary-700 font-medium' : 'text-gray-700'}`}>{reward.reward_name}</span>
                        {isSelected && <Check size={14} className="text-primary-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedRewards.size > 0 && (
                <p className="text-sm text-primary-600 font-medium text-center">{selectedRewards.size} rewards selected</p>
              )}

              <div className="flex gap-4">
                <button onClick={() => setManualStep(detectedRooms.length > 0 || manualStep === 5 ? 3 : 4)} className="flex-1 border border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50 transition">Back</button>
                <button
                  onClick={handleManualSubmit}
                  disabled={loading}
                  className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {loading ? 'Setting Up...' : 'Complete Setup'}
                </button>
              </div>
              <button
                onClick={() => { setSelectedRewards(new Set()); handleManualSubmit(); }}
                disabled={loading}
                className="w-full text-xs text-gray-500 hover:text-gray-700 py-2 transition"
              >
                Skip rewards & finish
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
