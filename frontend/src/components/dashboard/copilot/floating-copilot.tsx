"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence, animate, useDragControls, useMotionValue } from "framer-motion";
import Link from "next/link";
import { X, Send, Loader2, User, RotateCcw, Minimize2, Maximize2, Keyboard, Mic, Volume2, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArsFace, type ArsMood } from "@/components/dashboard/copilot/ars-face";
import {
  useArsVoice,
  type ListenError,
  type SpeakResult,
  type SpokenWord,
  type VoiceLang,
} from "@/components/dashboard/copilot/use-ars-voice";
import { useVoiceActivity } from "@/components/dashboard/copilot/use-voice-activity";
import { VoicePulse } from "@/components/dashboard/copilot/voice-pulse";
import { AI_LIMITS } from "@/lib/ai-limits";
import { ApiError, describeApiError } from "@/lib/api-error";
import { useSession } from "@/lib/auth-client";
import { getCopilotAllowance, sendCopilotMessage } from "@/lib/copilot-client";
import { defineCopy } from "@/lib/i18n/core";
import { useCopy, useLocale } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import type { ChatMessage, CopilotAllowance, CopilotStyle } from "@/types/copilot";

type Corner = "bottom-right" | "bottom-left" | "top-right" | "top-left";

/**
 * Where each corner sits. Plain classes rather than animated top/left: framer
 * can't tween "auto", so animating them left Ars mid-screen on a phone.
 */
const CORNER_CLASS: Record<Corner, string> = {
  "top-left": "top-20 left-6",
  "top-right": "top-20 right-6",
  "bottom-left": "bottom-6 left-6",
  "bottom-right": "bottom-6 right-6",
};
type View = "voice" | "text";
type Phase = "idle" | "listening" | "thinking" | "speaking";

/** Listening that breaks this many times in a row (not silence: errors) ends the conversation. */
const MAX_LISTEN_FAILURES = 3;

/** Set once the mentor has made its entrance this browser session (cleared on sign-out). */
const INTRO_KEY = "acceptify-ars-intro";
/**
 * Where the RU/EN voice choice used to be remembered. It is no longer kept:
 * an EN left over from one tap made the browser hear Russian speech as
 * English gibberish, and BRO answered it in English.
 */
const STALE_VOICE_LANG_KEY = "acceptify-ars-voice-lang";
const STYLE_KEY = "acceptify-bro-style";

/** Signing out ends the session, so the next sign-in gets the entrance again. */
export function forgetArsIntro() {
  try {
    sessionStorage.removeItem(INTRO_KEY);
  } catch {}
}

/** Short and soft, not bouncy: the face rises into place and the caption follows. */
const INTRO_EASE = [0.22, 1, 0.36, 1] as const;

const copy = defineCopy({
  en: {
    suggestions: [
      "How do I estimate my chances of getting in?",
      "What SAT/IELTS scores do top universities ask for?",
      "How do I build a balanced university list?",
      "What matters most in a personal essay?",
    ],
    greeting:
      "👋 Hi! I'm BRO, your personal admissions bro.\n\nI know your academic profile and can help with your admissions strategy, choosing universities, exam prep and deadlines. What can I help with?",
    error: "The AI connection had a temporary problem. Please try again.",
    name: "BRO",
    mentor: "Your personal admissions bro",
    caption: (name: string | null) => (name ? `Your Personal Bro ${name}` : "Your Personal Bro"),
    collapse: "Collapse",
    expand: "Expand",
    cleared: "History cleared. How can I help with your applications?",
    clear: "Clear the conversation",
    close: "Close",
    thinking: "Looking at your profile...",
    placeholder: "Ask about your chances, essays or deadlines...",
    send: "Send",
    open: "BRO, your admissions mentor (drag to any corner)",
    tapToTalk: "Just talk, I'm listening",
    tapFace: "Talk to BRO",
    listening: "Listening... just talk",
    pondering: "Thinking...",
    speaking: "Talking... just speak up to cut in",
    idle: "Tap me to keep talking",
    outTitle: "Out of credits",
    outBody: "You've used up today's credits on the free plan. Get Plus from 990 ₸ to keep going.",
    getPro: "Get Plus",
    textTired: "You've used up today's messages on the free plan. Get Plus from 990 ₸ to keep going.",
    downTitle: "Sorry, technical difficulties",
    downBody: "The voice isn't working right now. Try again a bit later — you can still type.",
    gotIt: "OK",
    typeInstead: "Type instead",
    talkInstead: "Talk by voice",
    voiceLeft: (left: number, total: number) => `Voice: ${left}/${total} today`,
    micDenied: "Allow the microphone for this site, then tap me.",
    unsupported: "This browser can't hear you. Voice works in Chrome, Edge and Safari — or just type.",
    micTrouble: "The microphone isn't working. Tap me to try again.",
    replay: "Hear the answer again",
    strict: "Strict",
    strictOn: "Strict bro is on: no excuses and real swearing. Tap to turn off.",
    strictOff: "Turn on strict bro: no excuses, real swearing in Russian, Kazakh and English (voice only).",
  },
  ru: {
    suggestions: [
      "Как оценить мои шансы на поступление?",
      "Какие баллы SAT/IELTS нужны в топовые вузы?",
      "Как составить сбалансированный список вузов?",
      "Что самое важное в мотивационном эссе?",
    ],
    greeting:
      "👋 Привет! Я BRO, твой личный бро по поступлению.\n\nЯ знаю твой академический профиль и могу помочь со стратегией поступления, выбором вузов, подготовкой к экзаменам и дедлайнами. Чем помочь?",
    error: "Временная ошибка связи с ИИ. Попробуй ещё раз.",
    name: "BRO",
    mentor: "Твой личный бро по поступлению",
    caption: (name: string | null) => (name ? `Your Personal Bro ${name}` : "Your Personal Bro"),
    collapse: "Свернуть",
    expand: "Развернуть",
    cleared: "История очищена. Чем помочь с поступлением?",
    clear: "Очистить диалог",
    close: "Закрыть",
    thinking: "Смотрю твой профиль...",
    placeholder: "Спроси о шансах, эссе или дедлайнах...",
    send: "Отправить",
    open: "BRO, твой наставник по поступлению (можно перетащить в любой угол)",
    tapToTalk: "Просто говори, я слушаю",
    tapFace: "Поговорить с BRO",
    listening: "Слушаю... просто говори",
    pondering: "Думаю...",
    speaking: "Говорю... перебей голосом, если надо",
    idle: "Нажми на меня, чтобы продолжить",
    outTitle: "Кредиты закончились",
    outBody: "На бесплатном тарифе кредиты на сегодня закончились. Возьми Plus за 990 ₸, чтобы продолжить.",
    getPro: "Купить Plus",
    textTired: "Сообщения на сегодня закончились. Возьми Plus за 990 ₸, чтобы писать дальше.",
    downTitle: "Сорян, технические неполадки",
    downBody: "Голос сейчас не работает. Попробуй чуть позже, а пока можно написать текстом.",
    gotIt: "Понятно",
    typeInstead: "Написать",
    talkInstead: "Говорить голосом",
    voiceLeft: (left: number, total: number) => `Голос: ${left}/${total} на сегодня`,
    micDenied: "Разреши доступ к микрофону для этого сайта и нажми на меня.",
    unsupported: "Этот браузер не умеет слушать. Голос работает в Chrome, Edge и Safari — или просто напиши.",
    micTrouble: "Микрофон не отвечает. Нажми на меня, чтобы попробовать снова.",
    replay: "Послушать ответ ещё раз",
    strict: "Строгий",
    strictOn: "Строгий бро включён: без отмазок и с настоящим матом. Нажми, чтобы выключить.",
    strictOff: "Включить строгого бро: без отмазок, настоящий мат на русском, казахском и английском (только голосом).",
  },
});

export function FloatingCopilot() {
  const t = useCopy(copy);
  const locale = useLocale();
  const voice = useArsVoice();
  const vad = useVoiceActivity();
  /** True while a hands-free conversation runs: BRO listens again after each reply. */
  const talkingRef = useRef(false);
  const dragControls = useDragControls();
  const { data: session } = useSession();
  const firstName = session?.user?.name?.trim().split(/\s+/)[0] || null;
  const INITIAL_SUGGESTIONS = t.suggestions;
  const [mounted, setMounted] = useState(false);
  const [corner, setCorner] = useState<Corner>("bottom-right");
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [view, setView] = useState<View>("voice");
  const [playIntro, setPlayIntro] = useState(false);
  const [allowance, setAllowance] = useState<CopilotAllowance | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", content: t.greeting }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [followups, setFollowups] = useState<string[]>(INITIAL_SUGGESTIONS);
  const [isDragging, setIsDragging] = useState(false);
  // The drag offset; after a drop it springs back to 0 at the new corner.
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const moverRef = useRef<HTMLDivElement>(null);
  const dropRect = useRef<DOMRect | null>(null);
  const [drops, setDrops] = useState(0);

  const [phase, setPhase] = useState<Phase>("idle");
  const [started, setStarted] = useState(false);
  const [heard, setHeard] = useState("");
  const [lastReply, setLastReply] = useState("");
  /** Lets the last spoken reply be read in Gemini's voice (see the speech route). */
  const lastSpeechRef = useRef<{ token: string; style: CopilotStyle } | null>(null);
  const [note, setNote] = useState<string | null>(null);
  /**
   * The language the student last spoke, as Gemini heard it. Nobody picks it:
   * it only tells the browser's recognizer what to expect, so the live
   * caption is right; the reply follows whatever they actually say.
   */
  const spokenLangRef = useRef<VoiceLang>(locale);
  const [word, setWord] = useState<SpokenWord | null>(null);
  const [strict, setStrict] = useState(false);
  /** Gemini's voice failed: the mentor stays silent and says so on screen. */
  const [voiceDown, setVoiceDown] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
    try {
      localStorage.removeItem(STALE_VOICE_LANG_KEY);
      const style = localStorage.getItem(STYLE_KEY);
      // "uncensored" is what the old 18+ chip saved.
      setStrict(style === "strict" || style === "uncensored");
    } catch {}
    getCopilotAllowance()
      .then(setAllowance)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isOpen && view === "text") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, view]);

  const voiceTired = allowance?.voice_left === 0;
  const textTired = allowance?.text_left === 0;

  function openPanel() {
    let firstTime = false;
    try {
      firstTime = sessionStorage.getItem(INTRO_KEY) !== "1";
      sessionStorage.setItem(INTRO_KEY, "1");
    } catch {}
    setPlayIntro(firstTime);
    setIsOpen(true);
    // Like ChatGPT's voice mode: opening BRO is the only tap, he starts listening by himself.
    void startConversation();
    getCopilotAllowance()
      .then(setAllowance)
      .catch(() => {});
  }

  function closePanel() {
    endConversation();
    setIsOpen(false);
    // Ars always greets by voice; typing is one tap away.
    setView("voice");
    setPhase("idle");
    setVoiceDown(false);
    setStarted(false);
    setHeard("");
    setLastReply("");
    setNote(null);
  }

  function saveStyle(style: CopilotStyle) {
    try {
      localStorage.setItem(STYLE_KEY, style);
    } catch {}
  }

  function toggleStrict() {
    const next = !strict;
    setStrict(next);
    saveStyle(next ? "strict" : "friendly");
  }

  // The conversation loop outlives the render that started it; it reads the
  // chips' current state from here, so switching mid-conversation applies.
  const chipsRef = useRef({ strict });
  useEffect(() => {
    chipsRef.current = { strict };
  }, [strict]);

  // A new site language is the best first guess again.
  useEffect(() => {
    spokenLangRef.current = locale;
  }, [locale]);

  // Determine which corner is closest when drag ends
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: { point: { x: number; y: number } }) => {
    setIsDragging(false);
    if (typeof window === "undefined") return;

    dropRect.current = moverRef.current?.getBoundingClientRect() ?? null;
    setDrops((n) => n + 1);

    // info.point is on the page; Ars lives on the screen, so take the scroll off.
    const x = info.point.x - window.scrollX;
    const y = info.point.y - window.scrollY;
    const midX = window.innerWidth / 2;
    const midY = window.innerHeight / 2;

    const isLeft = x < midX;
    const isTop = y < midY;

    if (isTop && isLeft) {
      setCorner("top-left");
    } else if (isTop && !isLeft) {
      setCorner("top-right");
    } else if (!isTop && isLeft) {
      setCorner("bottom-left");
    } else {
      setCorner("bottom-right");
    }
  };

  // Once the new corner is laid out, start Ars where he was dropped and let
  // him glide in, instead of keeping the drag offset on top of the corner.
  useLayoutEffect(() => {
    const el = moverRef.current;
    const from = dropRect.current;
    dropRect.current = null;
    if (!el || !from) return;
    dragX.set(0);
    dragY.set(0);
    const to = el.getBoundingClientRect();
    dragX.set(from.left - to.left);
    dragY.set(from.top - to.top);
    const spring = { type: "spring", stiffness: 350, damping: 28 } as const;
    animate(dragX, 0, spring);
    animate(dragY, 0, spring);
  }, [drops, dragX, dragY]);

  function markSpent(mode: "text" | "voice") {
    setAllowance((prev) => ({
      ...prev,
      text_left: mode === "text" ? 0 : (prev?.text_left ?? AI_LIMITS.copilot.perDay),
      voice_left: mode === "voice" ? 0 : (prev?.voice_left ?? AI_LIMITS.copilot_voice.perDay),
    }));
  }

  function noteLeft(mode: "text" | "voice", left: number | undefined) {
    if (typeof left !== "number") return;
    setAllowance((prev) => ({
      ...prev,
      text_left: mode === "text" ? left : (prev?.text_left ?? AI_LIMITS.copilot.perDay),
      voice_left: mode === "voice" ? left : (prev?.voice_left ?? AI_LIMITS.copilot_voice.perDay),
    }));
  }

  async function handleSend(textToSend?: string) {
    const text = (textToSend || input).trim();
    if (!text || isLoading || textTired) return;

    const newMsg: ChatMessage = { role: "user", content: text };
    const updated = [...messages, newMsg];
    setMessages(updated);
    setInput("");
    setIsLoading(true);

    try {
      const res = await sendCopilotMessage(updated, true, "text", locale);
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
      noteLeft("text", res.left);
      if (res.suggested_followups && res.suggested_followups.length > 0) {
        setFollowups(res.suggested_followups);
      }
    } catch (err) {
      console.error("Copilot error:", err);
      if (err instanceof ApiError && err.status === 429) markSpent("text");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ ${describeApiError(err, t.error)}`,
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  /** Reads a reply aloud in Gemini's voice, moving the mouth with it. No voice, no reading. */
  async function readAloud(text: string): Promise<SpeakResult> {
    const speech = lastSpeechRef.current;
    if (!voice.canSpeak || !speech) {
      setVoiceDown(true);
      return "unavailable";
    }
    setPhase("speaking");
    const result = await voice.speak(text, speech.token, speech.style, setWord);
    setWord(null);
    if (result === "unavailable") setVoiceDown(true);
    setPhase((current) => (current === "speaking" ? "idle" : current));
    return result;
  }

  /** The speaker button: a fresh tap, so it works even where autoplay was blocked. */
  function replay() {
    if (phase !== "idle" || !lastReply) return;
    setNote(null);
    voice.unlockSpeech();
    void readAloud(lastReply);
  }

  /** Stops the hands-free conversation wherever it is and lets go of the microphone. */
  function endConversation() {
    talkingRef.current = false;
    vad.close();
    voice.stopListening();
    voice.stopSpeaking();
    setWord(null);
    setPhase("idle");
  }

  /**
   * A hands-free conversation, started by opening the card (or switching
   * back to voice) — no tapping: BRO listens, answers, and listens again by
   * himself, through silences too, and if the student starts talking while
   * he speaks he stops and listens. Closing the card or switching to typing
   * ends it. Call it inside the tap that opened the card: that is what lets
   * the browser play his voice later.
   */
  async function startConversation() {
    if (voiceTired || voiceDown || talkingRef.current) return;
    setNote(null);
    if (!voice.canListen) {
      setStarted(true);
      return setNote(t.unsupported);
    }

    voice.unlockSpeech();
    talkingRef.current = true;
    // For hearing the student over BRO; without it the turns still work, just without interrupting.
    await vad.open();
    if (talkingRef.current) await converse();
  }

  /** The face is no button any more, except to cut BRO off or to pick up a conversation that stopped. */
  function handleFaceTap() {
    if (phase === "speaking") return voice.stopSpeaking();
    if (!talkingRef.current) void startConversation();
  }

  async function converse() {
    let history = messages;
    let failures = 0;
    while (talkingRef.current) {
      setHeard("");
      setPhase("listening");
      let text: string;
      const listenedAt = performance.now();
      // The turn is recorded too, so Gemini can hear which language it is in.
      const recording = vad.record();
      try {
        text = await voice.listen(spokenLangRef.current, {
          onInterim: (interim) => {
            setHeard(interim);
            // The name caption stays up until the student first says something.
            if (interim) setStarted(true);
          },
        });
      } catch (reason) {
        recording?.cancel();
        if (!talkingRef.current) return;
        const error = reason as ListenError;
        // The browser gives up after a few quiet seconds: just listen again.
        // Giving up at once is not silence (the mic is busy, say), so that counts as a failure.
        const quiet = error === "no-speech" && performance.now() - listenedAt > 1500;
        if (quiet) continue;
        if ((error === "failed" || error === "no-speech") && ++failures < MAX_LISTEN_FAILURES) {
          await new Promise((resolve) => setTimeout(resolve, 600));
          continue;
        }
        endConversation();
        setStarted(true);
        setNote(error === "denied" ? t.micDenied : error === "unsupported" ? t.unsupported : t.micTrouble);
        return;
      }
      const audio = recording?.stop() ?? null;
      if (!talkingRef.current) return;
      failures = 0;
      setStarted(true);

      setHeard(text);
      setLastReply("");
      setPhase("thinking");
      history = [...history, { role: "user", content: text }];
      setMessages(history);

      const chips = chipsRef.current;
      const style: CopilotStyle = chips.strict ? "strict" : "friendly";
      let left: number | undefined;
      try {
        const res = await sendCopilotMessage(
          history,
          true,
          "voice",
          spokenLangRef.current,
          style,
          audio ? { mime_type: "audio/wav", data: audio } : undefined,
        );
        if (!talkingRef.current) return;
        // What Gemini heard beats the browser's guess, which listened for one language only.
        if (res.heard) {
          history = [...history.slice(0, -1), { role: "user", content: res.heard }];
          setHeard(res.heard);
        }
        if (res.lang) spokenLangRef.current = res.lang;
        history = [...history, { role: "assistant", content: res.reply }];
        setMessages(history);
        lastSpeechRef.current = res.speech_token ? { token: res.speech_token, style } : null;
        setLastReply(res.reply);
        noteLeft("voice", res.left);
        left = res.left;
        if (res.suggested_followups?.length) setFollowups(res.suggested_followups);

        // The student talking over BRO cuts him off and starts the next turn.
        vad.watch(() => voice.stopSpeaking());
        const result = await readAloud(res.reply);
        vad.unwatch();
        if (result === "unavailable") return endConversation();
      } catch (err) {
        endConversation();
        if (err instanceof ApiError && err.status === 429) markSpent("voice");
        else if (err instanceof ApiError && err.status === 503) setVoiceDown(true);
        else {
          setStarted(true);
          setNote(describeApiError(err, t.error));
        }
        return;
      }
      // Out of voice turns for today: the sad face takes over.
      if (left === 0) return endConversation();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function switchView(next: View) {
    endConversation();
    setView(next);
    if (next === "text") setTimeout(() => inputRef.current?.focus(), 150);
    else void startConversation();
  }

  const isLeftCorner = corner.includes("left");
  const isTopCorner = corner.includes("top");

  if (!mounted) return null;

  const faceMood: ArsMood = phase === "idle" ? "idle" : phase;
  const statusLine =
    phase === "listening" ? t.listening : phase === "thinking" ? t.pondering : phase === "speaking" ? t.speaking : t.idle;
  const showCaption = !started;
  const introFrom = (delay: number) =>
    playIntro
      ? {
          initial: { opacity: 0, y: 14, scale: 0.94 },
          animate: { opacity: 1, y: 0, scale: 1 },
          transition: { duration: 0.42, ease: INTRO_EASE, delay },
        }
      : { initial: false as const };

  return (
    <div className="fixed z-50 pointer-events-none inset-0 overflow-hidden">
      <motion.div
        drag
        // Only Ars himself is a handle, so the chat can scroll and text can be selected.
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragElastic={0.15}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        ref={moverRef}
        style={{ x: dragX, y: dragY }}
        className={cn(
          "pointer-events-auto absolute flex flex-col",
          CORNER_CLASS[corner],
          isLeftCorner ? "items-start" : "items-end",
        )}
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={playIntro ? { opacity: 0, y: isTopCorner ? -12 : 12 } : { opacity: 0 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: playIntro ? 0.25 : 0.12, ease: "easeOut" }}
              className={cn(
                "mb-3 flex flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-2xl",
                view === "text" && isExpanded ? "h-[620px] w-[90vw] sm:w-[480px]" : "h-[500px] w-[88vw] sm:w-[380px]",
                "max-h-[calc(100dvh-140px)]",
              )}
            >
              {view === "voice" ? (
                <div className="relative flex flex-1 flex-col bg-[radial-gradient(120%_70%_at_50%_0%,var(--ars-glow)_0%,transparent_65%)]">
                  {(voiceTired || voiceDown) && (
                    // Out of credits, or no voice to talk with: the whole card says so.
                    <div
                      role="alert"
                      className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-card px-6 text-center"
                    >
                      <button
                        type="button"
                        onClick={closePanel}
                        title={t.close}
                        aria-label={t.close}
                        className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {/* Out of credits, the mentor shakes his head: "no more". */}
                      <motion.div
                        animate={voiceTired ? { x: [0, -14, 14, -10, 10, -4, 0], rotate: [0, -5, 5, -4, 4, -1, 0] } : undefined}
                        transition={{ duration: 1.1, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.4 }}
                      >
                        <ArsFace mood="sad" className="w-[168px]" />
                      </motion.div>
                      <p className="mt-6 text-[18px] font-extrabold tracking-tight text-foreground">
                        {voiceTired ? t.outTitle : t.downTitle}
                      </p>
                      <p className="mx-auto mt-2 max-w-[280px] text-sm text-muted-foreground">
                        {voiceTired ? t.outBody : t.downBody}
                      </p>
                      <div className="mt-5 flex w-full max-w-[240px] flex-col gap-2">
                        {voiceTired ? (
                          <Button size="sm" render={<Link href="/pricing" />}>
                            {t.getPro}
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => setVoiceDown(false)}>
                            {t.gotIt}
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => switchView("text")}>
                          {t.typeInstead}
                        </Button>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={closePanel}
                    title={t.close}
                    aria-label={t.close}
                    className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="absolute left-3 top-3 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={toggleStrict}
                      aria-pressed={strict}
                      title={strict ? t.strictOn : t.strictOff}
                      aria-label={strict ? t.strictOn : t.strictOff}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                        strict
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Flame className="h-3 w-3" />
                      {t.strict}
                    </button>
                  </div>

                  <div className="flex flex-1 flex-col items-center justify-center px-6 pt-6">
                    <motion.button
                      type="button"
                      {...introFrom(0)}
                      whileTap={{ scale: 0.96 }}
                      onClick={handleFaceTap}
                      aria-label={t.tapFace}
                      className="cursor-pointer rounded-[48px] outline-offset-4"
                    >
                      <VoicePulse
                        level={phase === "speaking" ? voice.outputLevel : phase === "listening" ? vad.level : null}
                        loud={phase === "speaking" ? 0.2 : 0.1}
                        grow={phase === "speaking" ? 0.14 : 0.07}
                        breathing={phase === "thinking"}
                      >
                        <ArsFace mood={faceMood} word={word} strict={strict} className="w-[208px]" />
                      </VoicePulse>
                    </motion.button>

                    <div className="mt-6 min-h-[92px] w-full text-center" aria-live="polite">
                      {showCaption ? (
                        <motion.div {...introFrom(0.1)}>
                          <p className="text-[18px] font-extrabold tracking-tight text-foreground">
                            {t.caption(firstName)}
                          </p>
                          <p className="mx-auto mt-1 max-w-[270px] text-xs text-muted-foreground">{t.tapToTalk}</p>
                        </motion.div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">{statusLine}</p>
                          {heard && (
                            <p className="line-clamp-2 text-sm italic text-foreground/70">«{heard}»</p>
                          )}
                          {lastReply && phase !== "listening" && (
                            <div className="flex items-start gap-2 text-left">
                              <p className="max-h-24 flex-1 overflow-y-auto [scrollbar-width:thin] text-sm leading-relaxed text-foreground">
                                {lastReply}
                              </p>
                              {voice.canSpeak && phase === "idle" && (
                                <button
                                  type="button"
                                  onClick={replay}
                                  title={t.replay}
                                  aria-label={t.replay}
                                  className="shrink-0 rounded-full border border-border bg-background p-1.5 text-foreground transition-colors hover:bg-accent"
                                >
                                  <Volume2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {note && <p className="mt-2 text-xs text-destructive">{note}</p>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
                    <div className="flex items-center gap-2">
                      {allowance && (
                        <span className="text-[11px] text-muted-foreground">
                          {t.voiceLeft(allowance.voice_left, allowance.voice_total ?? AI_LIMITS.copilot_voice.perDay)}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => switchView("text")}
                      className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
                    >
                      <Keyboard className="h-3.5 w-3.5" />
                      {t.typeInstead}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/40">
                    <div className="flex items-center gap-2.5">
                      <ArsFace
                        mood={textTired ? "sad" : isLoading ? "thinking" : "idle"}
                        className="w-11"
                      />
                      <div>
                        <h3 className="font-heading text-sm font-semibold leading-none">{t.name}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{t.mentor}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => setIsExpanded(!isExpanded)}
                        title={isExpanded ? t.collapse : t.expand}
                        aria-label={isExpanded ? t.collapse : t.expand}
                      >
                        {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          setMessages([{ role: "assistant", content: t.cleared }]);
                          setFollowups(INITIAL_SUGGESTIONS);
                          setLastReply("");
                          setHeard("");
                        }}
                        title={t.clear}
                        aria-label={t.clear}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={closePanel}
                        title={t.close}
                        aria-label={t.close}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs sm:text-sm">
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {msg.role === "assistant" && <ArsFace className="mt-1 w-7 shrink-0 self-start" />}
                        <div
                          className={`rounded-2xl px-3.5 py-2.5 max-w-[85%] leading-relaxed ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground rounded-br-xs font-normal"
                              : "bg-muted/70 text-foreground rounded-bl-xs border border-border/40 whitespace-pre-wrap"
                          }`}
                        >
                          {msg.content}
                        </div>
                        {msg.role === "user" && (
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground mt-0.5">
                            <User className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex gap-2.5 items-center text-muted-foreground text-xs pl-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span>{t.thinking}</span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {followups.length > 0 && !isLoading && !textTired && (
                    <div className="px-3 py-1.5 border-t border-dashed flex gap-1.5 overflow-x-auto no-scrollbar">
                      {followups.slice(0, 3).map((f, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSend(f)}
                          className="shrink-0 text-[11px] bg-muted hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground px-2.5 py-1 rounded-full border border-border/50 text-left"
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="p-3 border-t bg-background/50">
                    {textTired && (
                      <p className="mb-2 text-center text-xs text-muted-foreground">
                        {t.textTired}{" "}
                        <Link href="/pricing" className="font-semibold text-primary underline-offset-2 hover:underline">
                          {t.getPro}
                        </Link>
                      </p>
                    )}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSend();
                      }}
                      className="flex items-center gap-2"
                    >
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => switchView("voice")}
                        title={t.talkInstead}
                        aria-label={t.talkInstead}
                        className="h-9 w-9 shrink-0 rounded-xl"
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                      <textarea
                        ref={inputRef}
                        rows={1}
                        value={input}
                        disabled={textTired}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t.placeholder}
                        className="flex-1 resize-none bg-muted/60 border border-input rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary min-h-[36px] max-h-[90px] disabled:opacity-60"
                      />
                      <Button
                        type="submit"
                        size="icon"
                        disabled={!input.trim() || isLoading || textTired}
                        aria-label={t.send}
                        className="h-9 w-9 shrink-0 rounded-xl"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* The launcher is Ars himself, small; drag him to any corner. */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => {
            if (isDragging) return;
            if (isOpen) closePanel();
            else openPanel();
          }}
          onPointerDown={(e) => dragControls.start(e)}
          style={{ touchAction: "none" }}
          title={t.open}
          aria-label={t.open}
          aria-expanded={isOpen}
          className="relative rounded-[28px] shadow-[0_10px_30px_-8px_rgba(7,19,38,0.45)] cursor-grab active:cursor-grabbing"
        >
          <ArsFace mood={voiceTired && textTired ? "sad" : "idle"} className="w-[76px]" />
        </motion.button>
      </motion.div>
    </div>
  );
}
