import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

interface UseSpeechRecognitionOptions {
  silenceTimeout?: number;
  onSpeechEnd?: (transcript: string) => void;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
  isSpeechDetected: boolean;
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  const { silenceTimeout = 1500, onSpeechEnd } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeechDetected, setIsSpeechDetected] = useState(false);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalTranscriptRef = useRef<string>('');
  const onSpeechEndRef = useRef(onSpeechEnd);

  // Keep the callback reference up to date
  useEffect(() => {
    onSpeechEndRef.current = onSpeechEnd;
  }, [onSpeechEnd]);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const startSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      // Silence detected - stop listening and fire callback
      if (recognitionRef.current && finalTranscriptRef.current.trim()) {
        const finalText = finalTranscriptRef.current.trim();
        recognitionRef.current.stop();
        setIsListening(false);
        setIsSpeechDetected(false);
        setTranscript(finalText);
        setInterimTranscript('');

        if (onSpeechEndRef.current) {
          onSpeechEndRef.current(finalText);
        }
      } else if (recognitionRef.current) {
        // No speech was detected, just stop
        recognitionRef.current.stop();
        setIsListening(false);
        setIsSpeechDetected(false);
      }
    }, silenceTimeout);
  }, [silenceTimeout, clearSilenceTimer]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            final += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }

        // Track that speech was detected
        if (final || interim) {
          setIsSpeechDetected(true);
        }

        // Update final transcript accumulator
        if (final) {
          finalTranscriptRef.current = final;
          setTranscript(final);
        }

        // Update interim transcript for real-time display
        setInterimTranscript(interim);

        // Reset silence timer on new speech
        if (interim || final) {
          startSilenceTimer();
        }
      };

      recognitionRef.current.onspeechstart = () => {
        setIsSpeechDetected(true);
        startSilenceTimer();
      };

      recognitionRef.current.onspeechend = () => {
        // Speech ended naturally, start silence timer if not already
        startSilenceTimer();
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        clearSilenceTimer();
        setIsListening(false);
        setIsSpeechDetected(false);

        // Don't stop if it's a no-speech error - just restart
        if (event.error === 'no-speech') {
          return;
        }
      };

      recognitionRef.current.onend = () => {
        clearSilenceTimer();
        setIsListening(false);
        setIsSpeechDetected(false);
      };
    }

    return () => {
      clearSilenceTimer();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [startSilenceTimer, clearSilenceTimer]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      finalTranscriptRef.current = '';
      setTranscript('');
      setInterimTranscript('');
      setIsSpeechDetected(false);
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        // Already started - ignore
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    clearSilenceTimer();
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setIsSpeechDetected(false);
    }
  }, [isListening, clearSilenceTimer]);

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    isSpeechDetected,
  };
}

let currentAudio: HTMLAudioElement | null = null;
let speakGeneration = 0;

// Persistent Audio element — must be created & unlocked during a user gesture
// to satisfy browser autoplay policies. Call initAudioElement() from any click handler.
let reusableAudio: HTMLAudioElement | null = null;

export function initAudioElement(): void {
  if (!reusableAudio) {
    reusableAudio = new Audio();
    // Unlock by playing a tiny silent MP3 (required by Safari/mobile browsers)
    reusableAudio.src = 'data:audio/mp3;base64,SUQzBAAAAAABEVRTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAABhkA+IHAAAAAA//tQxAAAAAADSAAAAAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tQxDwAAADSAAAAAAAAANIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    reusableAudio.play().then(() => {
      reusableAudio!.pause();
    }).catch(() => {
      // Ignore — will retry on next user gesture
    });
  }
}

export function speak(text: string, onEnd?: () => void): void {
  // Stop any current audio first
  stopSpeaking();

  // Increment generation so any in-flight TTS calls from previous speak() are ignored
  const thisGeneration = ++speakGeneration;

  // If no unlocked audio element, fall back to browser TTS immediately
  if (!reusableAudio) {
    fallbackBrowserTTS(text, onEnd);
    return;
  }

  const audio = reusableAudio;

  // Try OpenAI TTS first, fall back to browser speechSynthesis
  api.textToSpeech(text)
    .then(({ audio_base64, content_type }) => {
      // If a newer speak() was called while we were fetching, bail out
      if (thisGeneration !== speakGeneration) return;

      audio.src = `data:${content_type};base64,${audio_base64}`;
      currentAudio = audio;
      audio.onended = () => {
        currentAudio = null;
        if (thisGeneration === speakGeneration && onEnd) onEnd();
      };
      audio.onerror = () => {
        currentAudio = null;
        if (thisGeneration === speakGeneration) fallbackBrowserTTS(text, onEnd);
      };
      audio.play().catch(() => {
        currentAudio = null;
        if (thisGeneration === speakGeneration) fallbackBrowserTTS(text, onEnd);
      });
    })
    .catch((err) => {
      console.error('[TTS] API call failed, falling back to browser:', err?.message || err);
      if (thisGeneration === speakGeneration) fallbackBrowserTTS(text, onEnd);
    });
}

function fallbackBrowserTTS(text: string, onEnd?: () => void): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }
    window.speechSynthesis.speak(utterance);
  } else if (onEnd) {
    onEnd();
  }
}

export function stopSpeaking(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
