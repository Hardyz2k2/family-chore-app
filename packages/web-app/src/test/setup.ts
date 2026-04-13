import '@testing-library/jest-dom';

// Mock scrollIntoView which doesn't exist in jsdom
Element.prototype.scrollIntoView = vi.fn();

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock SpeechRecognition
(window as any).SpeechRecognition = undefined;
(window as any).webkitSpeechRecognition = undefined;

// Mock speechSynthesis
Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: {
    cancel: vi.fn(),
    speak: vi.fn(),
    getVoices: vi.fn().mockReturnValue([]),
  },
});
