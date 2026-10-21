import React, { useState, useRef, useEffect } from "react";
import { Send, CornerDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ComposerProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const Composer: React.FC<ComposerProps> = ({
  onSend,
  disabled = false,
  placeholder = "Ask: 'Is it safe to go out tomorrow morning?'",
  className = "",
}) => {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const maxLength = 1000;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [content]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setContent("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const charsRemaining = maxLength - content.length;
  const isNearLimit = charsRemaining <= 100;

  return (
    <div className={`p-3 border-t border-border bg-surface flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-end gap-2 bg-surface-raised border border-border-strong rounded-lg p-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, maxLength))}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          maxLength={maxLength}
          className="flex-1 bg-transparent border-0 resize-none text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-0 p-1 max-h-32 leading-relaxed"
          aria-label="Marine inquiry message"
        />

        <Button
          type="button"
          onClick={handleSend}
          disabled={!content.trim() || disabled}
          size="sm"
          className="h-8 w-8 p-0 rounded-md shrink-0 flex items-center justify-center"
          title="Send inquiry (Enter)"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-1 text-[11px] text-ink-muted gap-1">
        <div className="flex items-center gap-2">
          <span>Official warnings override ORCA.</span>
          <span>•</span>
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">
            Terms of Service
          </a>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3 font-mono">
          <span className="hidden sm:inline">
            <CornerDownLeft className="h-3 w-3 inline mr-0.5" /> Enter to send
          </span>
          <span
            className={`${
              isNearLimit ? "text-amber-500 font-semibold" : ""
            }`}
          >
            {content.length}/{maxLength}
          </span>
        </div>
      </div>
    </div>
  );
};
