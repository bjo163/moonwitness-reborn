import { useState, type ReactElement } from "react";
import { Users, BookOpen, Send } from "lucide-react";
import { Button } from "../atoms/button.js";
import { Textarea } from "../atoms/textarea.js";

export type ReflectionModerationStatus = "quarantined" | "approved" | "rejected";

export interface StudyCircleItem {
  id: string;
  title: string;
  surahNumber: number;
  facilitatorName: string;
  memberCount: number;
  status: "active" | "concluded";
}

export interface CircleReflectionItem {
  id: string;
  circleId: string;
  authorCallsign: string;
  passageLocator: string;
  content: string;
  moderationStatus: ReflectionModerationStatus;
  createdAt: string;
}

export interface StudyCircleDirectoryProps {
  circles: StudyCircleItem[];
  onSelectCircle(this: void, circleId: string): void;
  className?: string;
  title?: string;
}

export interface StudyCircleRoomProps {
  circle: StudyCircleItem;
  reflections: CircleReflectionItem[];
  isFacilitator?: boolean;
  onSubmitReflection(
    this: void,
    content: string,
    passageLocator: string,
  ): Promise<void>;
  onModerateReflection?(
    this: void,
    reflectionId: string,
    decision: "approved" | "rejected",
  ): Promise<void>;
  onBack?(this: void): void;
  className?: string;
}

export function StudyCircleDirectory({
  circles,
  onSelectCircle,
  className = "",
  title = "Harbor Thematic Study Circles",
}: StudyCircleDirectoryProps): ReactElement {
  return (
    <div className={`ql-study-circle-directory space-y-4 ${className}`}>
      <h3 className="ql-display text-xl font-semibold text-ink">{title}</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {circles.map((circle) => (
          <div
            key={circle.id}
            onClick={() => onSelectCircle(circle.id)}
            className="group cursor-pointer border border-hairline bg-panel p-5 transition-all hover:border-acid"
          >
            <div className="flex items-center justify-between text-xs text-acid">
              <span className="font-mono">Surah {circle.surahNumber}</span>
              <span className="border border-hairline px-2 py-0.5 uppercase tracking-wider text-muted">
                {circle.status}
              </span>
            </div>
            <h4 className="mt-2 text-base font-semibold text-ink group-hover:text-acid">
              {circle.title}
            </h4>
            <div className="mt-4 flex items-center justify-between text-xs text-muted">
              <span>Facilitator: {circle.facilitatorName}</span>
              <span className="flex items-center gap-1">
                <Users className="size-3" />
                {circle.memberCount}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StudyCircleRoom({
  circle,
  reflections,
  isFacilitator = false,
  onSubmitReflection,
  onModerateReflection,
  className = "",
}: StudyCircleRoomProps): ReactElement {
  const [content, setContent] = useState("");
  const [locator, setLocator] = useState(`${circle.surahNumber}:1`);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmitReflection(content, locator);
      setContent("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`ql-study-circle-room border border-hairline bg-panel p-6 ${className}`}>
      <div className="flex items-center justify-between border-b border-hairline pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-acid">
            <BookOpen className="size-4" />
            <span>Surah {circle.surahNumber} Circle</span>
          </div>
          <h3 className="ql-display mt-1 text-2xl font-semibold text-ink">{circle.title}</h3>
        </div>
        <div className="text-right text-xs text-muted">
          <p>Facilitator: {circle.facilitatorName}</p>
          <p>{circle.memberCount} Contemplators</p>
        </div>
      </div>

      {/* Reflections Stream */}
      <div className="mt-6 space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Contemplation Reflections ({reflections.length})
        </h4>
        {reflections.length === 0 ? (
          <p className="text-xs text-muted">
            No reflections shared yet for this Surah. Be the first to share your contemplation.
          </p>
        ) : (
          <div className="space-y-3">
            {reflections.map((r) => (
              <div
                key={r.id}
                className="border border-hairline-soft bg-panel-well p-4 text-xs text-ink"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{r.authorCallsign}</span>
                    <span className="font-mono text-acid">Ayah {r.passageLocator}</span>
                  </div>
                  <span className="text-[10px] uppercase text-muted">
                    {r.moderationStatus}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{r.content}</p>
                {isFacilitator && r.moderationStatus === "quarantined" && onModerateReflection && (
                  <div className="mt-3 flex gap-2 pt-2 border-t border-hairline">
                    <Button
                      size="sm"
                      onClick={() => void onModerateReflection(r.id, "approved")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void onModerateReflection(r.id, "rejected")}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Write reflection form */}
      <div className="mt-6 border-t border-hairline pt-4 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-ink">
          Share Contemplation (Tadabbur)
        </h4>
        <div className="flex gap-2">
          <input
            type="text"
            value={locator}
            onChange={(e) => setLocator(e.target.value)}
            placeholder="Ayah e.g. 18:10"
            className="w-32 border border-hairline bg-panel-well px-3 py-2 text-xs text-ink focus:border-acid focus:outline-none"
          />
        </div>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your respectful contemplation on this verse..."
          rows={3}
          className="w-full text-xs"
        />
        <Button
          onClick={() => void handleSubmit()}
          disabled={!content.trim() || submitting}
          className="inline-flex items-center gap-2"
        >
          <Send className="size-4" />
          <span>Post Reflection</span>
        </Button>
      </div>
    </div>
  );
}
