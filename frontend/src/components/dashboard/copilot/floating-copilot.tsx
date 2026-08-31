"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Bot,
  User,
  RotateCcw,
  Minimize2,
  Maximize2,
  GripHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { sendCopilotMessage } from "@/lib/copilot-client";
import type { ChatMessage } from "@/types/copilot";

type Corner = "bottom-right" | "bottom-left" | "top-right" | "top-left";

const INITIAL_SUGGESTIONS = [
  "Как оценить мои шансы на поступление?",
  "Какие требования у топовых вузов по SAT/IELTS?",
  "Как составить сбалансированный список вузов?",
  "Что самое важное в мотивационном эссе?",
];

export function FloatingCopilot() {
  const [corner, setCorner] = useState<Corner>("bottom-right");
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "👋 Привет! Я ваш **Acceptify AI Copilot** на базе **Gemini 3.7 Flash**.\n\nЯ знаю ваш академический профиль и могу помочь со стратегией поступления, выбором вузов, подготовкой к экзаменам и дедлайнам. Чем могу помочь?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [followups, setFollowups] = useState<string[]>(INITIAL_SUGGESTIONS);
  const [isDragging, setIsDragging] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

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

  async function handleSend(textToSend?: string) {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const newMsg: ChatMessage = { role: "user", content: text };
    const updated = [...messages, newMsg];
    setMessages(updated);
    setInput("");
    setIsLoading(true);

    try {
      const res = await sendCopilotMessage(updated, true);
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
      if (res.suggested_followups && res.suggested_followups.length > 0) {
        setFollowups(res.suggested_followups);
      }
    } catch (err) {
      console.error("Copilot error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Произошла временная ошибка соединения с AI. Пожалуйста, попробуйте еще раз.",
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const isLeftCorner = corner.includes("left");
  const isTopCorner = corner.includes("top");

  return (
    <div className="fixed z-50 pointer-events-none inset-0 overflow-hidden">
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.15}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        animate={getCornerPosition(corner)}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="pointer-events-auto absolute flex flex-col"
        style={{ touchAction: "none" }}
      >
        {/* Floating Chat Modal / Drawer */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: isTopCorner ? -20 : 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: isTopCorner ? -20 : 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`mb-3 flex flex-col rounded-2xl border bg-background/95 shadow-2xl backdrop-blur-xl transition-all ${
                isExpanded
                  ? "h-[620px] w-[90vw] sm:w-[480px]"
                  : "h-[480px] w-[88vw] sm:w-[380px]"
              } ${isLeftCorner ? "origin-bottom-left" : "origin-bottom-right"}`}
            >
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/40 rounded-t-2xl">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-violet-500 text-primary-foreground shadow-sm">
                    <Sparkles className="h-4 w-4" />
                    <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-heading text-sm font-semibold leading-none">Acceptify Copilot</h3>
                      <Badge variant="secondary" className="h-4 text-[10px] px-1 font-mono font-normal">
                        Gemini 3.7
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">AI Admissions Mentor</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => setIsExpanded(!isExpanded)}
                    title={isExpanded ? "Свернуть" : "Развернуть"}
                  >
                    {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      setMessages([
                        {
                          role: "assistant",
                          content: "История очищена. Чем могу помочь по вашему поступлению?",
                        },
                      ]);
                      setFollowups(INITIAL_SUGGESTIONS);
                    }}
                    title="Очистить диалог"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => setIsOpen(false)}
                    title="Закрыть"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs sm:text-sm">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                    )}
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
                    <span>Gemini 3.7 анализирует ваш профиль...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Suggestions Chips */}
              {followups.length > 0 && !isLoading && (
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

              {/* Input Footer */}
              <div className="p-3 border-t bg-background/50 rounded-b-2xl">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-2"
                >
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Спросите о шансах, эссе или дедлайнах..."
                    className="flex-1 resize-none bg-muted/60 border border-input rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary min-h-[36px] max-h-[90px]"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || isLoading}
                    className="h-9 w-9 shrink-0 rounded-xl"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Animated Avatar Button with Magnetic Corner Snap */}
        <div className="relative group flex items-center justify-center">
          {/* Pulsing Aura */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.4, 0.75, 0.4],
            }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-primary via-purple-500 to-indigo-500 blur-md"
          />

          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              if (!isDragging) setIsOpen(!isOpen);
            }}
            title="Acceptify AI Mentor (Перемещайте в любой угол)"
            className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary via-violet-600 to-indigo-700 text-white shadow-xl ring-2 ring-background cursor-grab active:cursor-grabbing"
          >
            <motion.div
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="h-6 w-6 drop-shadow-md text-amber-200" />
            </motion.div>

            {/* Corner Drag Indicator dots */}
            <span className="absolute bottom-1 flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity">
              <GripHorizontal className="h-3 w-3 text-white/80" />
            </span>

            {/* Online Status Dot */}
            <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-background bg-emerald-500"></span>
            </span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
