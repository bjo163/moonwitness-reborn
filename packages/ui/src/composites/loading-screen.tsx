import { cn } from "../lib/utils.js";
import { Alert } from "../components/alert.js";
import { Button } from "../atoms/button.js";

export interface LoadingScreenProps {
  /** Text shown while the screen is still resolving. Omit for an error-only state. */
  label?: string;
  error?: string | null;
  /** Offers a way out of a failed load; without it an error is a dead end. */
  onRetry?(): void;
  retryLabel?: string;
  className?: string;
}

/**
 * Full-viewport centered status/loading surface used while a screen
 * resolves its initial session or data. Replaces the thirteen copies of
 * `<main className="ql-hud-app flex min-h-dvh items-center justify-center
 * px-6 text-sm …">` (MW-ADR-020). If an error message is provided, it
 * renders an error `Alert` in place of the loading label; callers do not
 * need to branch.
 */
export function LoadingScreen({
  label,
  error,
  onRetry,
  retryLabel,
  className,
}: LoadingScreenProps) {
  return (
    <main
      className={cn(
        "ql-hud-app flex min-h-dvh items-center justify-center px-6 text-sm text-ink-soft",
        className,
      )}
    >
      {error ? (
        <Alert variant="error">
          <p>{error}</p>
          {onRetry !== undefined && retryLabel !== undefined ? (
            <Button className="mt-3" onClick={() => onRetry()} variant="secondary">
              {retryLabel}
            </Button>
          ) : null}
        </Alert>
      ) : label !== undefined ? (
        <p role="status">{label}</p>
      ) : null}
    </main>
  );
}
