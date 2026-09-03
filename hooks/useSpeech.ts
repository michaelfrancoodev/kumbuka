"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Language } from "@/lib/types";

/**
 * Voice capture, via the browser's Web Speech API.
 *
 * 1. Words appear as they are spoken — interim results are requested and
 *    rendered live, so the speaker can see they are being heard.
 * 2. The session survives natural pauses. Chrome ends recognition on its own
 *    after a short silence even with `continuous` set, so an unexpected end
 *    is restarted transparently and the transcript continues.
 * 3. Recording stops itself after ten seconds of genuine silence, since the
 *    speaker's hands may be dirty or occupied.
 *
 * Support varies by browser; `available` reflects that, and typing always
 * works regardless — voice is an enhancement, never a requirement.
 */

export type SpeechState = "unavailable" | "idle" | "listening" | "silence" | "denied" | "error";

const SILENCE_STOP_MS = 10_000;
const SILENCE_WARN_MS = 3_000;
const TICK_MS = 250;

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
}

function getRecognitionConstructor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as
    | (new () => SpeechRecognitionLike)
    | null;
}

export function useSpeech({
  language,
  onComplete,
}: {
  language: Language;
  onComplete: (transcript: string) => void;
}) {
  const [state, setState] = useState<SpeechState>("idle");
  const [transcript, setTranscript] = useState("");

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTextRef = useRef("");
  const lastSoundRef = useRef(0);
  const stoppingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!getRecognitionConstructor()) setState("unavailable");
  }, []);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const finish = useCallback(() => {
    stoppingRef.current = true;
    clearTimer();
    try {
      recognitionRef.current?.stop();
    } catch {
      // Already stopped.
    }
    const result = finalTextRef.current.trim();
    setState("idle");
    setTranscript("");
    if (result) onCompleteRef.current(result);
  }, []);

  const start = useCallback(() => {
    const Recognition = getRecognitionConstructor();
    if (!Recognition) {
      setState("unavailable");
      return;
    }

    const recognition = new Recognition();
    recognition.lang = language === "sw" ? "sw-TZ" : "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    finalTextRef.current = "";
    stoppingRef.current = false;
    lastSoundRef.current = Date.now();
    setTranscript("");

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const alternative = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTextRef.current += alternative;
        else interim += alternative;
      }
      lastSoundRef.current = Date.now();
      setState("listening");
      setTranscript((finalTextRef.current + interim).trimStart());
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        stoppingRef.current = true;
        clearTimer();
        setState("denied");
        return;
      }
      if (event.error !== "no-speech" && event.error !== "aborted") {
        stoppingRef.current = true;
        clearTimer();
        setState("error");
      }
    };

    // Chrome ends the session on its own after a short pause. Restart unless
    // the stop was ours, so a natural pause mid-sentence is not a cut-off.
    recognition.onend = () => {
      if (stoppingRef.current) return;
      try {
        recognition.start();
      } catch {
        stoppingRef.current = true;
        clearTimer();
        setState("idle");
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setState("listening");
    } catch {
      setState("error");
      return;
    }

    clearTimer();
    timerRef.current = setInterval(() => {
      const quietFor = Date.now() - lastSoundRef.current;
      if (quietFor >= SILENCE_STOP_MS) finish();
      else if (quietFor >= SILENCE_WARN_MS) setState("silence");
    }, TICK_MS);
  }, [language, finish]);

  const cancel = useCallback(() => {
    stoppingRef.current = true;
    clearTimer();
    try {
      recognitionRef.current?.abort();
    } catch {
      // Already stopped.
    }
    finalTextRef.current = "";
    setTranscript("");
    setState("idle");
  }, []);

  useEffect(() => {
    return () => {
      stoppingRef.current = true;
      clearTimer();
      try {
        recognitionRef.current?.abort();
      } catch {
        // Nothing to release.
      }
    };
  }, []);

  return {
    state,
    transcript,
    start,
    stop: finish,
    cancel,
    available: state !== "unavailable",
    listening: state === "listening" || state === "silence",
  };
}
