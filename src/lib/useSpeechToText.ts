"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// The Web Speech API has no official TS lib types; this is a minimal shape
// of what we actually use, scoped locally rather than touching global types.
type SpeechRecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type SpeechRecognitionEvent = { resultIndex: number; results: ArrayLike<SpeechRecognitionResult> };
type SpeechRecognitionErrorEvent = { error: string };
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

// Errors where retrying won't help — stop for real and tell the user why.
const FATAL_ERRORS = new Set(["not-allowed", "audio-capture", "service-not-allowed"]);

export function useSpeechToText(onFinalResult: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const shouldBeRecordingRef = useRef(false);
  const onFinalResultRef = useRef(onFinalResult);
  onFinalResultRef.current = onFinalResult;

  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    setIsSupported(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  const createRecognition = useCallback(() => {
    const w = window as unknown as Record<string, unknown>;
    const SpeechRecognitionCtor = (w.SpeechRecognition || w.webkitSpeechRecognition) as
      | (new () => SpeechRecognitionLike)
      | undefined;
    if (!SpeechRecognitionCtor) return null;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        if (result.isFinal) {
          onFinalResultRef.current(transcript.trim());
        } else {
          interim += transcript;
        }
      }
      setInterimText(interim);
    };

    recognition.onerror = (event) => {
      if (FATAL_ERRORS.has(event.error)) {
        shouldBeRecordingRef.current = false;
        setIsRecording(false);
        setErrorMessage(
          event.error === "not-allowed" || event.error === "service-not-allowed"
            ? "Microphone access was blocked — check your browser's site permissions."
            : "No microphone was found."
        );
      }
      // Other errors (e.g. "no-speech", "network", "aborted") are transient —
      // onend still fires after these, and the restart logic there handles it.
    };

    // Browsers stop recognition on their own after a stretch of silence, even
    // with continuous=true. If the user hasn't clicked "stop," treat that as
    // the engine pausing, not the conversation ending — restart it seamlessly.
    recognition.onend = () => {
      setInterimText("");
      if (shouldBeRecordingRef.current) {
        const next = createRecognition();
        if (next) {
          recognitionRef.current = next;
          next.start();
          return;
        }
      }
      setIsRecording(false);
    };

    return recognition;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = useCallback(() => {
    const recognition = createRecognition();
    if (!recognition) return;
    setErrorMessage(null);
    shouldBeRecordingRef.current = true;
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [createRecognition]);

  const stop = useCallback(() => {
    shouldBeRecordingRef.current = false;
    recognitionRef.current?.stop();
    setIsRecording(false);
  }, []);

  useEffect(() => {
    return () => {
      shouldBeRecordingRef.current = false;
      recognitionRef.current?.stop();
    };
  }, []);

  return { isRecording, interimText, isSupported, errorMessage, start, stop };
}
