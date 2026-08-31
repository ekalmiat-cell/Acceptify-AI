"use client";

import { useMemo, useState } from "react";
import { Sparkles, Upload, FileText, Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { University } from "@/types/domain";
import type { EssayAnalyzeRequest } from "@/types/essay";

const COMMON_PROMPTS = [
  {
    label: "Common App #1: Meaningful Identity / Background",
    prompt:
      "Some students have a background, identity, interest, or talent that is so meaningful they believe their application would be incomplete without it. If this sounds like you, then please share your story.",
  },
  {
    label: "Common App #2: Overcoming Obstacles / Resilience",
    prompt:
      "The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure. How did it affect you, and what did you learn from the experience?",
  },
  {
    label: "Common App #3: Challenging a Belief or Idea",
    prompt:
      "Reflect on a time when you questioned or challenged a belief or idea. What prompted your thinking? What was the outcome?",
  },
  {
    label: "Common App #4: Gratitude / Meaningful Contribution",
    prompt:
      "Reflect on something that someone has done for you that has made you happy or thankful in a surprising way. How has this gratitude affected or motivated you?",
  },
  {
    label: "Common App #5: Spark of Personal Growth",
    prompt:
      "Discuss an accomplishment, event, or realization that sparked a period of personal growth and a new understanding of yourself or others.",
  },
  {
    label: "Common App #6: Intellectual Curiosity / Deep Topic",
    prompt:
      "Describe a topic, idea, or concept you find so engaging that it makes you lose all track of time. Why does it captivate you? What or who do you turn to when you want to learn more?",
  },
  {
    label: "Supplemental: 'Why This College?'",
    prompt:
      "Why are you interested in attending this university, and how will our specific academic programs, faculty, and campus community help you achieve your future goals?",
  },
  {
    label: "Custom Prompt",
    prompt: "",
  },
];

interface EssayInputFormProps {
  universities: University[];
  onSubmit: (payload: EssayAnalyzeRequest) => void;
  isLoading: boolean;
  initialUniversityId?: string | null;
}

export function EssayInputForm({
  universities,
  onSubmit,
  isLoading,
  initialUniversityId,
}: EssayInputFormProps) {
  const [title, setTitle] = useState("Common App Personal Statement");
  const [universityId, setUniversityId] = useState<string>(initialUniversityId ?? "none");
  const [selectedPromptIndex, setSelectedPromptIndex] = useState<string>("0");
  const [customPrompt, setCustomPrompt] = useState("");
  const [essayText, setEssayText] = useState("");
  const [includeProfile, setIncludeProfile] = useState(true);

  // Derived metrics
  const wordCount = useMemo(() => {
    const trimmed = essayText.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [essayText]);

  const charCount = essayText.length;
  const readingTimeMin = Math.max(1, Math.ceil(wordCount / 220));

  // Resolved prompt
  const activePromptText = useMemo(() => {
    if (selectedPromptIndex === "custom" || selectedPromptIndex === "7") {
      return customPrompt;
    }
    const idx = parseInt(selectedPromptIndex, 10);
    return COMMON_PROMPTS[idx]?.prompt ?? "";
  }, [selectedPromptIndex, customPrompt]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File is too large (max 2MB).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setEssayText(content);
        if (!title || title === "Common App Personal Statement") {
          setTitle(file.name.replace(/\.[^/.]+$/, ""));
        }
        toast.success(`Loaded "${file.name}" (${content.split(/\s+/).length} words)`);
      }
    };
    reader.onerror = () => {
      toast.error("Could not read file text.");
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (wordCount < 25) {
      toast.error("Please enter at least 25 words to analyze your essay.");
      return;
    }

    onSubmit({
      title: title.trim() || "Admissions Essay",
      essay_text: essayText,
      university_id: universityId === "none" ? null : universityId,
      prompt_text: activePromptText.trim() || null,
      include_profile_context: includeProfile,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Submit Essay for AI Admissions Review
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Get rigorous, admissions-committee-grade feedback on voice, narrative, structure, and university fit.
              </CardDescription>
            </div>

            {/* Document Upload Button */}
            <div className="relative">
              <input
                type="file"
                id="doc-upload"
                accept=".txt,.md,.doc,.docx,.pdf"
                onChange={handleFileUpload}
                className="sr-only"
              />
              <label htmlFor="doc-upload">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer gap-1.5 text-xs"
                  onClick={() => document.getElementById("doc-upload")?.click()}
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload File</span>
                </Button>
              </label>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Title & Target University Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
            <div className="sm:col-span-7 space-y-1.5">
              <Label htmlFor="essay-title" className="text-xs font-semibold">
                Draft Title
              </Label>
              <Input
                id="essay-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. MIT Maker Portfolio Essay Draft 2"
                className="text-sm"
              />
            </div>

            <div className="sm:col-span-5 space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Target University</span>
              </Label>
              <Select value={universityId} onValueChange={(v) => setUniversityId(v as string)}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select target university..." />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="none">General / Not University Specific</SelectItem>
                  {universities.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.country})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Prompt Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Admissions Prompt / Topic</span>
            </Label>
            <Select value={selectedPromptIndex} onValueChange={(v) => setSelectedPromptIndex(v as string)}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select standard prompt or custom..." />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {COMMON_PROMPTS.map((p, idx) => (
                  <SelectItem key={idx} value={String(idx)}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Custom Prompt Textarea if selected */}
            {(selectedPromptIndex === "7" || selectedPromptIndex === "custom") && (
              <div className="pt-2 animate-in fade-in-50">
                <Textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Paste the university-specific prompt or essay question here..."
                  rows={2}
                  className="text-xs"
                />
              </div>
            )}
          </div>

          {/* Main Essay Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="essay-content" className="text-xs font-semibold">
                Essay Text
              </Label>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className={wordCount > 650 ? "font-medium text-amber-600" : ""}>
                  {wordCount} words
                </span>
                <span>•</span>
                <span>{charCount} chars</span>
                <span>•</span>
                <span>~{readingTimeMin} min read</span>
              </div>
            </div>

            <Textarea
              id="essay-content"
              value={essayText}
              onChange={(e) => setEssayText(e.target.value)}
              placeholder="Paste your essay draft here (e.g. 250 - 800 words)..."
              rows={14}
              className="font-serif text-sm leading-relaxed tracking-normal p-4"
              required
            />
          </div>

          {/* Context switch & Submit CTA */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t">
            <div className="flex items-center gap-3">
              <Switch
                id="include-profile"
                checked={includeProfile}
                onCheckedChange={setIncludeProfile}
              />
              <Label htmlFor="include-profile" className="text-xs text-muted-foreground cursor-pointer">
                Include my academic profile & achievements to evaluate personalization fit
              </Label>
            </div>

            <Button
              type="submit"
              disabled={isLoading || wordCount < 25}
              size="lg"
              className="gap-2 font-semibold shadow-xs"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isLoading ? "Analyzing..." : "Review Essay with AI"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
