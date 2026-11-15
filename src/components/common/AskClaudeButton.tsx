import { EXERCISES } from "../../data/exercises.ts";
import { useAppState } from "../../hooks/useAppState.tsx";
import { useI18n } from "../../hooks/useI18n.ts";
import { useToast } from "../../hooks/useToast.tsx";
import { buildAskText, type AskFocus } from "../../lib/ask.ts";
import { shareText } from "../../lib/native.ts";
import { Button } from "./Button.tsx";

interface Props {
  focus: AskFocus;
  label?: string;
  small?: boolean;
  variant?: "primary" | "ghost";
}

/** Shares the training context (plan, recent sets, the focused exercise or workout) to the Claude app. */
export function AskClaudeButton({ focus, label, small = true, variant = "ghost" }: Props) {
  const { plan, sessions } = useAppState();
  const { t, lang } = useI18n();
  const toast = useToast();
  if (!plan) return null;

  const ask = async () => {
    try {
      const result = await shareText(buildAskText(plan, sessions, EXERCISES, lang, focus), t.ask.shareTitle);
      if (result === "copied") toast(t.ask.copied);
    } catch {
      toast(t.ask.failed);
    }
  };

  return <Button variant={variant} small={small} onClick={() => void ask()}>{label ?? t.ask.button}</Button>;
}
