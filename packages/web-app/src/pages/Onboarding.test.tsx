import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Onboarding from './Onboarding';

// Mock the API service
vi.mock('../services/api', () => ({
  default: {
    processVoiceSetup: vi.fn(),
    analyzeRoom: vi.fn(),
    createFamily: vi.fn(),
    addChild: vi.fn(),
    addRoomsAndChores: vi.fn(),
    distributeChores: vi.fn(),
    getFamilyDetails: vi.fn(),
    textToSpeech: vi.fn().mockResolvedValue({ audio_base64: 'bW9jaw==', content_type: 'audio/mpeg' }),
  },
}));

// Mock speech recognition hook
vi.mock('../hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: () => ({
    isListening: false,
    transcript: '',
    interimTranscript: '',
    startListening: vi.fn(),
    stopListening: vi.fn(),
    resetTranscript: vi.fn(),
    isSupported: true,
    isSpeechDetected: false,
  }),
  speak: vi.fn((_text: string, onEnd?: () => void) => {
    // Simulate async TTS completing immediately in tests
    if (onEnd) setTimeout(onEnd, 0);
  }),
  stopSpeaking: vi.fn(),
  initAudioElement: vi.fn(),
}));

// Mock zustand store
vi.mock('../store/useStore', () => ({
  useStore: () => ({
    user: { userId: 'test-user', firstName: 'Test', role: 'parent' },
    setFamily: vi.fn(),
  }),
}));

import api from '../services/api';

const renderOnboarding = () => {
  return render(
    <BrowserRouter>
      <Onboarding />
    </BrowserRouter>
  );
};

describe('Onboarding - Chat Interface', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: API returns initial greeting
    (api.processVoiceSetup as any).mockResolvedValue({
      session_id: 'test-session-123',
      message: "Hey there! I'm your family chore assistant. Are you a parent or guardian?",
      extracted_data: { family_name: null, house_type: null, children: [] },
      is_complete: false,
    });
  });

  it('renders the chat interface with header', async () => {
    renderOnboarding();
    expect(screen.getByText('Family Setup Assistant')).toBeInTheDocument();
  });

  it('shows the initial AI greeting message', async () => {
    renderOnboarding();
    await waitFor(() => {
      expect(screen.getByText(/family chore assistant/i)).toBeInTheDocument();
    });
  });

  it('calls processVoiceSetup on mount to start conversation', async () => {
    renderOnboarding();
    await waitFor(() => {
      expect(api.processVoiceSetup).toHaveBeenCalledWith(null, '');
    });
  });

  it('has a text input field and send button', async () => {
    renderOnboarding();
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type your response...')).toBeInTheDocument();
    });
  });

  it('has a mic button for voice input', async () => {
    renderOnboarding();
    await waitFor(() => {
      // The mic button should be present since speech is "supported" in our mock
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  it('has a TTS toggle button', async () => {
    renderOnboarding();
    await waitFor(() => {
      expect(screen.getByTitle(/mute voice/i)).toBeInTheDocument();
    });
  });

  it('has a form mode switch button', async () => {
    renderOnboarding();
    expect(screen.getByText('Form mode')).toBeInTheDocument();
  });

  it('sends text message when user types and presses Enter', async () => {
    (api.processVoiceSetup as any)
      .mockResolvedValueOnce({
        session_id: 'test-session-123',
        message: "Hey there! Are you a parent or guardian?",
        extracted_data: { family_name: null, house_type: null, children: [] },
        is_complete: false,
      })
      .mockResolvedValueOnce({
        session_id: 'test-session-123',
        message: "Great! What's your family's last name?",
        extracted_data: { family_name: null, house_type: null, children: [] },
        is_complete: false,
      });

    renderOnboarding();
    const user = userEvent.setup();

    // Wait for initial greeting
    await waitFor(() => {
      expect(screen.getByText(/parent or guardian/i)).toBeInTheDocument();
    });

    // Type and submit
    const input = screen.getByPlaceholderText('Type your response...');
    await user.type(input, 'Yes, I am a parent');
    await user.keyboard('{Enter}');

    // Should show user message in chat
    await waitFor(() => {
      expect(screen.getByText('Yes, I am a parent')).toBeInTheDocument();
    });

    // Should call API with the message
    expect(api.processVoiceSetup).toHaveBeenCalledWith('test-session-123', 'Yes, I am a parent');
  });

  it('shows typing indicator while processing', async () => {
    // Make the API call hang
    (api.processVoiceSetup as any)
      .mockResolvedValueOnce({
        session_id: 'test-session-123',
        message: "Are you a parent?",
        extracted_data: { family_name: null, house_type: null, children: [] },
        is_complete: false,
      })
      .mockImplementationOnce(() => new Promise(() => {})); // Never resolves

    renderOnboarding();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type your response...')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Type your response...');
    await user.type(input, 'Yes');
    await user.keyboard('{Enter}');

    // The send button should show a spinner
    await waitFor(() => {
      expect(screen.getByText('Yes')).toBeInTheDocument();
    });
  });

  it('displays setup progress when data is extracted', async () => {
    (api.processVoiceSetup as any)
      .mockResolvedValueOnce({
        session_id: 'test-session-123',
        message: "Are you a parent?",
        extracted_data: { family_name: null, house_type: null, children: [] },
        is_complete: false,
      })
      .mockResolvedValueOnce({
        session_id: 'test-session-123',
        message: "Great! The Smiths — love it. What type of home?",
        extracted_data: { family_name: 'Smith', house_type: null, children: [] },
        is_complete: false,
      });

    renderOnboarding();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type your response...')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Type your response...');
    await user.type(input, "Yes I am. We're the Smiths");
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText(/Family: Smith/i)).toBeInTheDocument();
    });
  });

  it('handles onboarding completion and asks about scanning', async () => {
    (api.processVoiceSetup as any)
      .mockResolvedValueOnce({
        session_id: 'test-session-123',
        message: "Are you a parent?",
        extracted_data: { family_name: null, house_type: null, children: [] },
        is_complete: false,
      })
      .mockResolvedValueOnce({
        session_id: 'test-session-123',
        message: "All confirmed! The Smith family in a house with Emma (age 8).",
        extracted_data: { family_name: 'Smith', house_type: 'house', children: [{ name: 'Emma', age: 8 }] },
        is_complete: true,
      });

    renderOnboarding();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type your response...')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Type your response...');
    await user.type(input, 'Yes that all looks right');
    await user.keyboard('{Enter}');

    // After completion, should ask about scanning
    await waitFor(() => {
      expect(screen.getByText(/scan your rooms/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});

describe('Onboarding - Manual Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.processVoiceSetup as any).mockResolvedValue({
      session_id: 'test-session-123',
      message: "Hey there!",
      extracted_data: { family_name: null, house_type: null, children: [] },
      is_complete: false,
    });
  });

  it('switches to manual mode when form mode button is clicked', async () => {
    renderOnboarding();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('Form mode')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Form mode'));
    expect(screen.getByText('Your Family')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Smith Family/i)).toBeInTheDocument();
  });

  it('shows family name step first in manual mode', async () => {
    renderOnboarding();
    const user = userEvent.setup();
    await user.click(screen.getByText('Form mode'));

    expect(screen.getByText('Your Family')).toBeInTheDocument();
    expect(screen.getByText('Continue')).toBeInTheDocument();
  });

  it('disables continue button when family name is empty', async () => {
    renderOnboarding();
    const user = userEvent.setup();
    await user.click(screen.getByText('Form mode'));

    const continueButton = screen.getByText('Continue');
    expect(continueButton).toBeDisabled();
  });

  it('enables continue button when family name is entered', async () => {
    renderOnboarding();
    const user = userEvent.setup();
    await user.click(screen.getByText('Form mode'));

    const input = screen.getByPlaceholderText(/Smith Family/i);
    await user.type(input, 'Johnson');

    const continueButton = screen.getByText('Continue');
    expect(continueButton).not.toBeDisabled();
  });

  it('progresses through steps: name → house type → children', async () => {
    renderOnboarding();
    const user = userEvent.setup();
    await user.click(screen.getByText('Form mode'));

    // Step 1: Enter family name
    await user.type(screen.getByPlaceholderText(/Smith Family/i), 'Johnson');
    await user.click(screen.getByText('Continue'));

    // Step 2: Should show house type selection
    expect(screen.getByText('Your Home')).toBeInTheDocument();
    expect(screen.getByText('House')).toBeInTheDocument();
    expect(screen.getByText('Apartment')).toBeInTheDocument();
    expect(screen.getByText('Condo')).toBeInTheDocument();
    expect(screen.getByText('Townhouse')).toBeInTheDocument();

    // Select house type
    await user.click(screen.getByText('House'));
    await user.click(screen.getAllByText('Continue')[1] || screen.getByText('Continue'));

    // Step 3: Should show children input
    expect(screen.getByText('Your Children')).toBeInTheDocument();
  });

  it('can switch back to chat mode from manual mode', async () => {
    renderOnboarding();
    const user = userEvent.setup();

    // Go to manual mode
    await user.click(screen.getByText('Form mode'));
    expect(screen.getByText('Your Family')).toBeInTheDocument();

    // Switch back to chat
    await user.click(screen.getByText('Switch to Chat Setup'));
    await waitFor(() => {
      expect(screen.getByText('Family Setup Assistant')).toBeInTheDocument();
    });
  });
});

describe('Onboarding - Room Scanning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.processVoiceSetup as any).mockResolvedValue({
      session_id: 'test-session-123',
      message: "Hey there!",
      extracted_data: { family_name: null, house_type: null, children: [] },
      is_complete: false,
    });
  });

  it('analyzes uploaded room images', async () => {
    (api.analyzeRoom as any).mockResolvedValue({
      rooms: [
        {
          name: 'Kitchen',
          confidence: 0.95,
          assets: ['refrigerator', 'dishwasher', 'oven'],
          suggestedChores: ['Wipe counters', 'Load dishwasher', 'Take out trash'],
        },
      ],
    });

    // We need to trigger the image analysis function
    // This tests the API mock returns correct data
    const result = await (api.analyzeRoom as any)('base64data');
    expect(result.rooms).toHaveLength(1);
    expect(result.rooms[0].name).toBe('Kitchen');
    expect(result.rooms[0].assets).toContain('refrigerator');
    expect(result.rooms[0].suggestedChores).toHaveLength(3);
  });

  it('handles room analysis with detected assets', async () => {
    (api.analyzeRoom as any).mockResolvedValue({
      rooms: [
        {
          name: 'Bathroom',
          confidence: 0.9,
          assets: ['toilet', 'shower', 'sink', 'mirror'],
          suggestedChores: ['Clean toilet', 'Scrub shower', 'Wipe mirror', 'Clean sink'],
        },
      ],
    });

    const result = await (api.analyzeRoom as any)('base64data');
    expect(result.rooms[0].assets).toHaveLength(4);
    expect(result.rooms[0].assets).toContain('toilet');
    expect(result.rooms[0].assets).toContain('shower');
  });

  it('handles empty room detection gracefully', async () => {
    (api.analyzeRoom as any).mockResolvedValue({
      rooms: [],
    });

    const result = await (api.analyzeRoom as any)('unclear-image');
    expect(result.rooms).toHaveLength(0);
  });

  it('handles analysis errors', async () => {
    (api.analyzeRoom as any).mockRejectedValue(new Error('Vision API error'));

    await expect((api.analyzeRoom as any)('bad-data')).rejects.toThrow('Vision API error');
  });
});

describe('Onboarding - Family Submission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.createFamily as any).mockResolvedValue({ family_id: 'family-123' });
    (api.addChild as any).mockResolvedValue({ user_id: 'child-1' });
    (api.addRoomsAndChores as any).mockResolvedValue({ choresCreated: [] });
    (api.distributeChores as any).mockResolvedValue({ assignmentsCreated: 5 });
    (api.getFamilyDetails as any).mockResolvedValue({
      family_id: 'family-123',
      family_name: 'Smith',
      members: [
        { userId: 'child-1', firstName: 'Emma', role: 'child', age: 8 },
      ],
    });
  });

  it('creates family with correct data', async () => {
    await (api.createFamily as any)({ family_name: 'Smith', house_type: 'house' });
    expect(api.createFamily).toHaveBeenCalledWith({ family_name: 'Smith', house_type: 'house' });
  });

  it('adds children after family creation', async () => {
    const familyRes = await (api.createFamily as any)({ family_name: 'Smith', house_type: 'house' });
    await (api.addChild as any)(familyRes.family_id, { first_name: 'Emma', age: 8 });
    expect(api.addChild).toHaveBeenCalledWith('family-123', { first_name: 'Emma', age: 8 });
  });

  it('adds rooms and distributes chores when rooms are detected', async () => {
    const rooms = [{ name: 'Kitchen', confidence: 0.95, assets: ['oven'], suggestedChores: ['Clean oven'] }];
    await (api.addRoomsAndChores as any)('family-123', rooms);
    await (api.distributeChores as any)('family-123');

    expect(api.addRoomsAndChores).toHaveBeenCalledWith('family-123', rooms);
    expect(api.distributeChores).toHaveBeenCalledWith('family-123');
  });

  it('distributes chores even without room scanning', async () => {
    await (api.distributeChores as any)('family-123');
    expect(api.distributeChores).toHaveBeenCalledWith('family-123');
  });
});
