"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { X, Send, Loader2, User, RotateCcw, Minimize2, Maximize2, Keyboard, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArsFace, type ArsMood } from "@/components/dashboard/copilot/ars-face";
import { useArsVoice, type ListenError, type VoiceLang } from "@/components/dashboard/copilot/use-ars-voice";
import { AI_LIMITS } from "@/lib/ai-limits";
import { ApiError, describeApiError } from "@/lib/api-error";
import { getCopilotAllowance, sendCopilotMessage } from "@/lib/copilot-client";
import { defineCopy } from "@/lib/i18n/core";
import { useCopy, useLocale } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import type { ChatMessage, CopilotAllowance } from "@/types/copilot";

type Corner = "bottom-right" | "bottom-left" | "top-right" | "top-left";
type View = "voice" | "text";
type Phase = "idle" | "listening" | "thinking" | "speaking";

/** Set once Ars has made his entrance this browser session (cleared on sign-out). */
const INTRO_KEY = "acceptify-ars-intro";
const VOICE_LANG_KEY = "acceptify-ars-voice-lang";

/** Signing out ends the session, so the next sign-in gets the entrance again. */
export function forgetArsIntro() {
  try {
    sessionStorage.removeItem(INTRO_KEY);
  } catch {}
}

/** Short and soft, not bouncy: Ars rises into place and the caption follows. */
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
      "👋 Hi! I'm Ars, your personal admissions bro.\n\nI know your academic profile and can help with your admissions strategy, choosing universities, exam prep and deadlines. What can I help with?",
    error: "The AI connection had a temporary problem. Please try again.",
    name: "Ars",
    mentor: "Your AI admissions mentor",
    collapse: "Collapse",
    expand: "Expand",
    cleared: "History cleared. How can I help with your applications?",
    clear: "Clear the conversation",
    close: "Close",
    thinking: "Looking at your profile...",
    placeholder: "Ask about your chances, essays or deadlines...",
    send: "Send",
    open: "Ars, your AI mentor (drag him to any corner)",
    tapToTalk: "Tap me and start talking",
    tapFace: "Talk to Ars",
    listening: "Listening... tap me when you're done",
    pondering: "Thinking...",
    speaking: "Talking... tap me to stop",
    idle: "Tap me to ask something else",
    tiredTitle: "Ars is out of breath today",
    tiredBody: "Today's voice replies are used up. They refill tomorrow — you can still type.",
    textTired: "Today's messages are used up. They refill tomorrow.",
    typeInstead: "Type instead",
    talkInstead: "Talk by voice",
    voiceLeft: (left: number, total: number) => `Voice: ${left}/${total} today`,
    micDenied: "Allow the microphone for this site, then tap me again.",
    unsupported: "This browser can't hear you. Voice works in Chrome, Edge and Safari — or just type.",
    didntHear: "I didn't catch that. Tap me and try again.",
    speechLang: "Language you speak",
  },
  ru: {
    suggestions: [
      "Как оценить мои шансы на поступление?",
      "Какие баллы SAT/IELTS нужны в топовые вузы?",
      "Как составить сбалансированный список вузов?",
      "Что самое важное в мотивационном эссе?",
    ],
    greeting:
      "👋 Привет! Я Арс, твой личный бро по поступлению.\n\nЯ знаю твой академический профиль и могу помочь со стратегией поступления, выбором вузов, подготовкой к экзаменам и дедлайнами. Чем помочь?",
    error: "Временная ошибка связи с ИИ. Попробуй ещё раз.",
    name: "Арс",
    mentor: "Твой ИИ-наставник по поступлению",
    collapse: "Свернуть",
    expand: "Развернуть",
    cleared: "История очищена. Чем помочь с поступлением?",
    clear: "Очистить диалог",
    close: "Закрыть",
    thinking: "Смотрю твой профиль...",
    placeholder: "Спроси о шансах, эссе или дедлайнах...",
    send: "Отправить",
    open: "Арс, твой ИИ-наставник (можно перетащить в любой угол)",
    tapToTalk: "Нажми на меня и говори",
    tapFace: "Поговорить с Арсом",
    listening: "Слушаю... нажми, когда договоришь",
    pondering: "Думаю...",
    speaking: "Говорю... нажми, чтобы остановить",
    idle: "Нажми, чтобы спросить ещё",
    tiredTitle: "Арс выдохся на сегодня",
    tiredBody: "Голосовые ответы на сегодня закончились. Завтра они обновятся, а пока можно писать текстом.",
    textTired: "Сообщения на сегодня закончились. Завтра они обновятся.",
    typeInstead: "Написать",
    talkInstead: "Говорить голосом",
    voiceLeft: (left: number, total: number) => `Голос: ${left}/${total} на сегодня`,
    micDenied: "Разреши доступ к микрофону для этого сайта и нажми на меня снова.",
    unsupported: "Этот браузер не умеет слушать. Голос работает в Chrome, Edge и Safari — или просто напиши.",
    didntHear: "Не расслышал. Нажми на меня и попробуй ещё раз.",
    speechLang: "Язык, на котором ты говоришь",
  },
});

export function FloatingCopilot() {
  const t = useCopy(copy);
  const locale = useLocale();
  const voice = useArsVoice();
  const dragControls = useDragControls();
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

  const [phase, setPhase] = useState<Phase>("idle");
  const [started, setStarted] = useState(false);
  const [heard, setHeard] = useState("");
  const [lastReply, setLastReply] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [voiceLang, setVoiceLang] = useState<VoiceLang>(locale);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(VOICE_LANG_KEY);
      if (saved === "ru" || saved === "en") setVoiceLang(saved);
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
    getCopilotAllowance()
      .then(setAllowance)
      .catch(() => {});
  }

  function closePanel() {
    voice.stopListening();
    voice.stopSpeaking();
    setIsOpen(false);
    // Ars always greets by voice; typing is one tap away.
    setView("voice");
    setPhase("idle");
    setStarted(false);
    setHeard("");
    setLastReply("");
    setNote(null);
  }

  function chooseVoiceLang(lang: VoiceLang) {
    setVoiceLang(lang);
    try {
      localStorage.setItem(VOICE_LANG_KEY, lang);
    } catch {}
  }

  // Corner positioning coordinates relative to viewport
  const getCornerPosition = (c: Corner) => {
    switch (c) {
      case "top-left":
        return { top: 80, left: 24, bottom: "auto", right: "auto" };
      case "top-right":
        return { top: 80, right: 24, bottom: "auto", left: "auto" };
      case "bottom-left":
        return { bottom: 24, left: 24, top: "auto", right: "auto" };
      case "bottom-right":
      default:
        return { bottom: 24, right: 24, top: "auto", left: "auto" };
    }
  };

  // Determine which corner is closest when drag ends
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: { point: { x: number; y: number } }) => {
    setIsDragging(false);
    if (typeof window === "undefined") return;

    const { x, y } = info.point;
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

  function markSpent(mode: "text" | "voice") {
    setAllowance((prev) => ({
      text_left: mode === "text" ? 0 : (prev?.text_left ?? AI_LIMITS.copilot.perDay),
      voice_left: mode === "voice" ? 0 : (prev?.voice_left ?? AI_LIMITS.copilot_voice.perDay),
    }));
  }

  function noteLeft(mode: "text" | "voice", left: number | undefined) {
    if (typeof left !== "number") return;
    setAllowance((prev) => ({
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
      const res = await sendCopilotMessage(updated, true);
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

  /** One spoken turn: listen, ask, read the answer aloud. Tapping again stops. */
  async function handleFaceTap() {
    if (voiceTired) return;
    if (phase === "listening") return voice.stopListening();
    if (phase === "speaking") {
      voice.stopSpeaking();
      return setPhase("idle");
    }
    if (phase === "thinking") return;

    setStarted(true);
    setNote(null);
    if (!voice.canListen) return setNote(t.unsupported);

    voice.unlockSpeech();
    setHeard("");
    setPhase("listening");

    let text: string;
    try {
      text = await voice.listen(voiceLang, { onInterim: setHeard });
    } catch (reason) {
      const error = reason as ListenError;
      setPhase("idle");
      setNote(error === "denied" ? t.micDenied : error === "unsupported" ? t.unsupported : t.didntHear);
      return;
    }

    setHeard(text);
    setLastReply("");
    setPhase("thinking");
    const updated: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(updated);

    try {
      const res = await sendCopilotMessage(updated, true, "voice");
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
      setLastReply(res.reply);
      noteLeft("voice", res.left);
      if (res.suggested_followups?.length) setFollowups(res.suggested_followups);
      if (voice.canSpeak) {
        setPhase("speaking");
        await voice.speak(res.reply);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) markSpent("voice");
      else setNote(describeApiError(err, t.error));
    } finally {
      setPhase((current) => (current === "listening" ? current : "idle"));
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function switchView(next: View) {
    voice.stopListening();
    voice.stopSpeaking();
    setPhase("idle");
    setView(next);
    if (next === "text") setTimeout(() => inputRef.current?.focus(), 150);
  }

  const isLeftCorner = corner.includes("left");
  const isTopCorner = corner.includes("top");

  if (!mounted) return null;

  const faceMood: ArsMood = voiceTired && phase === "idle" ? "sad" : phase === "idle" ? "idle" : phase;
  const statusLine =
    phase === "listening" ? t.listening : phase === "thinking" ? t.pondering : phase === "speaking" ? t.speaking : t.idle;
  const showCaption = voiceTired || !started;
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
        animate={getCornerPosition(corner)}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className={cn("pointer-events-auto absolute flex flex-col", isLeftCorner ? "items-start" : "items-end")}
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={playIntro ? { opacity: 0, y: isTopCorner ? -12 : 12 } : { opacity: 0 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: playIntro ? 0.25 : 0.12, ease: "easeOut" }}
              // Ars always lives on a light card, whatever the theme.
              className={cn(
                "force-light mb-3 flex flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl",
                view === "text" && isExpanded ? "h-[620px] w-[90vw] sm:w-[480px]" : "h-[500px] w-[88vw] sm:w-[380px]",
                "max-h-[calc(100dvh-140px)]",
              )}
            >
              {view === "voice" ? (
                <div className="relative flex flex-1 flex-col bg-[radial-gradient(120%_70%_at_50%_0%,#e8f0ff_0%,#ffffff_65%)]">
                  <button
                    type="button"
                    onClick={closePanel}
                    title={t.close}
                    aria-label={t.close}
                    className="absolute right-3 top-3 rounded-full p-1.5 text-[#667085] transition-colors hover:bg-black/5 hover:text-[#0a0e14]"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="flex flex-1 flex-col items-center justify-center px-6 pt-6">
                    <motion.button
                      type="button"
                      {...introFrom(0)}
                      whileTap={voiceTired ? undefined : { scale: 0.96 }}
                      onClick={handleFaceTap}
                      aria-label={t.tapFace}
                      aria-disabled={voiceTired}
                      className={cn(
                        "rounded-[48px] outline-offset-4",
                        voiceTired ? "cursor-default" : "cursor-pointer",
                      )}
                    >
                      <ArsFace mood={faceMood} className="w-[208px]" />
                    </motion.button>

                    <div className="mt-6 min-h-[92px] w-full text-center" aria-live="polite">
                      {showCaption ? (
                        <motion.div key={voiceTired ? "tired" : "ready"} {...introFrom(0.1)}>
                          <p className="text-[18px] font-extrabold tracking-tight text-[#0a0e14]">
                            {voiceTired ? t.tiredTitle : "Your Personal Bro Ars"}
                          </p>
                          <p className="mx-auto mt-1 max-w-[270px] text-xs text-[#667085]">
                            {voiceTired ? t.tiredBody : t.tapToTalk}
                          </p>
                        </motion.div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-[#667085]">{statusLine}</p>
                          {heard && (
                            <p className="line-clamp-2 text-sm italic text-[#0a0e14]/70">«{heard}»</p>
                          )}
                          {lastReply && phase !== "listening" && (
                            <p className="mx-auto max-h-24 overflow-y-auto text-left text-sm leading-relaxed text-[#0a0e14]">
                              {lastReply}
                            </p>
                          )}
                        </div>
                      )}
                      {note && <p className="mt-2 text-xs text-[#b42318]">{note}</p>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-black/5 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        role="radiogroup"
                        aria-label={t.speechLang}
                        title={t.speechLang}
                        className="flex rounded-full border border-[#e5e7eb] bg-white p-0.5 text-[11px] font-semibold"
                      >
                        {(["ru", "en"] as const).map((lang) => (
                          <button
                            key={lang}
                            type="button"
                            role="radio"
                            aria-checked={voiceLang === lang}
                            onClick={() => chooseVoiceLang(lang)}
                            className={cn(
                              "rounded-full px-2 py-0.5 uppercase transition-colors",
                              voiceLang === lang ? "bg-[#0b1f3a] text-white" : "text-[#667085] hover:text-[#0a0e14]",
                            )}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                      {allowance && (
                        <span className="text-[11px] text-[#667085]">
                          {t.voiceLeft(allowance.voice_left, AI_LIMITS.copilot_voice.perDay)}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => switchView("text")}
                      className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-white px-3 py-1.5 text-xs font-semibold text-[#0b1f3a] transition-colors hover:bg-[#eef1f5]"
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
                    {textTired && <p className="mb-2 text-center text-xs text-muted-foreground">{t.textTired}</p>}
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
