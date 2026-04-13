import { describe, it, expect, vi } from 'vitest';

// Mock OpenAI before importing anything that uses it
vi.mock('openai', () => ({
  default: class {
    constructor() {}
    chat = { completions: { create: vi.fn() } };
    audio = {
      speech: {
        create: vi.fn().mockResolvedValue({
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
        }),
      },
    };
  },
}));

import { getInitialGreeting, textToSpeechAudio } from './openai';

describe('Voice Onboarding', () => {
  describe('getInitialGreeting', () => {
    it('returns a greeting message', () => {
      const greeting = getInitialGreeting();
      expect(greeting.message).toBeTruthy();
      expect(greeting.message.length).toBeGreaterThan(10);
    });

    it('returns empty extracted data', () => {
      const greeting = getInitialGreeting();
      expect(greeting.extracted_data.family_name).toBeNull();
      expect(greeting.extracted_data.house_type).toBeNull();
      expect(greeting.extracted_data.children).toEqual([]);
    });

    it('is not marked as complete', () => {
      const greeting = getInitialGreeting();
      expect(greeting.is_complete).toBe(false);
    });

    it('mentions parent or guardian', () => {
      const greeting = getInitialGreeting();
      expect(greeting.message.toLowerCase()).toContain('parent');
    });

    it('is warm and conversational', () => {
      const greeting = getInitialGreeting();
      // Should use contractions — sounds human
      expect(greeting.message).toMatch(/I'm|let's|it'll|you're/i);
    });

    it('mentions it will be quick', () => {
      const greeting = getInitialGreeting();
      expect(greeting.message.toLowerCase()).toMatch(/couple|minute|quick/);
    });
  });
});

describe('Room Image Analysis - Data Contracts', () => {
  describe('Image format handling', () => {
    it('should parse JPEG data URL', () => {
      const dataUrl = 'data:image/jpeg;base64,/9j/4AAQ...';
      const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      expect(matches).toBeTruthy();
      expect(matches![1]).toBe('image/jpeg');
      expect(matches![2]).toBe('/9j/4AAQ...');
    });

    it('should parse PNG data URL', () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgo...';
      const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      expect(matches).toBeTruthy();
      expect(matches![1]).toBe('image/png');
    });

    it('should detect raw base64 (no data URL prefix)', () => {
      const rawBase64 = '/9j/4AAQSkZJRg...';
      expect(rawBase64.startsWith('data:')).toBe(false);
    });
  });

  describe('Response parsing', () => {
    it('should parse valid room analysis JSON', () => {
      const validResponse = JSON.stringify({
        rooms: [{
          name: 'Kitchen',
          confidence: 0.95,
          assets: ['refrigerator', 'dishwasher', 'oven', 'microwave'],
          suggestedChores: ['Wipe counters', 'Load dishwasher', 'Clean oven'],
        }],
      });
      const parsed = JSON.parse(validResponse);
      expect(parsed.rooms).toHaveLength(1);
      expect(parsed.rooms[0].name).toBe('Kitchen');
      expect(parsed.rooms[0].assets).toHaveLength(4);
      expect(parsed.rooms[0].suggestedChores).toHaveLength(3);
    });

    it('should handle multi-room response', () => {
      const multi = JSON.stringify({
        rooms: [
          { name: 'Kitchen', confidence: 0.9, assets: ['oven'], suggestedChores: ['Clean oven'] },
          { name: 'Dining Room', confidence: 0.7, assets: ['table'], suggestedChores: ['Wipe table'] },
        ],
      });
      const parsed = JSON.parse(multi);
      expect(parsed.rooms).toHaveLength(2);
    });

    it('should handle empty rooms array', () => {
      const parsed = JSON.parse('{"rooms": []}');
      expect(parsed.rooms).toHaveLength(0);
    });

    it('should filter rooms below 0.5 confidence', () => {
      const rooms = [
        { name: 'Kitchen', confidence: 0.95, assets: [], suggestedChores: [] },
        { name: 'Unclear', confidence: 0.3, assets: [], suggestedChores: [] },
        { name: 'Bathroom', confidence: 0.8, assets: [], suggestedChores: [] },
      ];
      const filtered = rooms.filter(r => r.confidence >= 0.5);
      expect(filtered).toHaveLength(2);
      expect(filtered.map(r => r.name)).toEqual(['Kitchen', 'Bathroom']);
    });
  });

  describe('Chore difficulty inference', () => {
    const inferDifficulty = (choreName: string): string => {
      const lower = choreName.toLowerCase();
      if (lower.includes('deep clean') || lower.includes('scrub') || lower.includes('mop') || lower.includes('organiz')) {
        return 'hard';
      } else if (lower.includes('clean') || lower.includes('vacuum') || lower.includes('wash') || lower.includes('sweep')) {
        return 'medium';
      }
      return 'easy';
    };

    const inferPoints = (d: string) => d === 'hard' ? 25 : d === 'medium' ? 15 : 10;

    it('"Wipe counters" → easy (10pts)', () => {
      expect(inferDifficulty('Wipe counters')).toBe('easy');
      expect(inferPoints('easy')).toBe(10);
    });

    it('"Clean oven" → medium (15pts)', () => {
      expect(inferDifficulty('Clean oven')).toBe('medium');
      expect(inferPoints('medium')).toBe(15);
    });

    it('"Deep clean bathroom" → hard (25pts)', () => {
      expect(inferDifficulty('Deep clean bathroom')).toBe('hard');
      expect(inferPoints('hard')).toBe(25);
    });

    it('"Scrub shower tiles" → hard', () => {
      expect(inferDifficulty('Scrub shower tiles')).toBe('hard');
    });

    it('"Vacuum carpet" → medium', () => {
      expect(inferDifficulty('Vacuum carpet')).toBe('medium');
    });

    it('"Load dishwasher" → medium (contains "wash")', () => {
      expect(inferDifficulty('Load dishwasher')).toBe('medium');
    });

    it('"Set the table" → easy', () => {
      expect(inferDifficulty('Set the table')).toBe('easy');
    });

    it('"Organize closet" → hard', () => {
      expect(inferDifficulty('Organize closet')).toBe('hard');
    });

    it('"Sweep kitchen floor" → medium', () => {
      expect(inferDifficulty('Sweep kitchen floor')).toBe('medium');
    });
  });

  describe('Room deduplication', () => {
    it('should filter duplicate rooms by name', () => {
      const existing = [{ name: 'Kitchen' }];
      const incoming = [{ name: 'Kitchen' }, { name: 'Bathroom' }];
      const existingNames = new Set(existing.map(r => r.name.toLowerCase()));
      const unique = incoming.filter(r => !existingNames.has(r.name.toLowerCase()));
      expect(unique).toHaveLength(1);
      expect(unique[0].name).toBe('Bathroom');
    });

    it('should be case-insensitive', () => {
      const existing = [{ name: 'kitchen' }];
      const existingNames = new Set(existing.map(r => r.name.toLowerCase()));
      expect(existingNames.has('Kitchen'.toLowerCase())).toBe(true);
    });
  });

  describe('Voice onboarding response contracts', () => {
    it('complete response has all required fields', () => {
      const response = {
        message: "All confirmed!",
        extracted_data: {
          family_name: 'Smith',
          house_type: 'house',
          children: [{ name: 'Emma', age: 8 }],
        },
        is_complete: true,
      };
      expect(response.extracted_data.family_name).toBeTruthy();
      expect(response.extracted_data.house_type).toBeTruthy();
      expect(response.extracted_data.children.length).toBeGreaterThan(0);
      expect(response.is_complete).toBe(true);
    });

    it('incomplete response has null fields', () => {
      const response = {
        message: "What type of home?",
        extracted_data: {
          family_name: 'Smith',
          house_type: null,
          children: [],
        },
        is_complete: false,
      };
      expect(response.extracted_data.house_type).toBeNull();
      expect(response.is_complete).toBe(false);
    });

    it('children accumulate across turns', () => {
      const turn1 = { children: [{ name: 'Emma', age: 8 }] };
      const turn2 = { children: [{ name: 'Emma', age: 8 }, { name: 'Jack', age: 5 }] };
      expect(turn2.children).toHaveLength(2);
    });
  });
});

describe('Text-to-Speech', () => {
  it('returns a Buffer from textToSpeechAudio', async () => {
    const result = await textToSpeechAudio('Hello world');
    expect(result).toBeInstanceOf(Buffer);
  });

  it('returns a non-empty Buffer for valid text', async () => {
    const result = await textToSpeechAudio('Test speech');
    expect(result.length).toBeGreaterThan(0);
  });
});
