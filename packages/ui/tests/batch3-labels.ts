import type {
  AyahProofCardProps,
  AudioTilawahPlayerProps,
  ProofVerificationResultProps,
  SemanticCrossSurahGraphProps,
} from "../src/index.js";

/**
 * Batch 3 composites take every user-facing string through props, so each test
 * has to supply them. Keeping one copy here means a missing prop shows up as a
 * compile error against the real contract instead of a half-updated fixture.
 */
export const graphLabels: Pick<
  SemanticCrossSurahGraphProps,
  | "summaryLabel"
  | "graphDescriptionLabel"
  | "viewModeGroupLabel"
  | "graphLabel"
  | "tableLabel"
  | "emptyLabel"
  | "nodeColumnLabel"
  | "categoryColumnLabel"
  | "surahColumnLabel"
  | "weightColumnLabel"
  | "relationColumnLabel"
  | "fromColumnLabel"
  | "toColumnLabel"
  | "evidenceColumnLabel"
  | "actionsLabel"
  | "yesLabel"
  | "noLabel"
> = {
  summaryLabel: "Semantic network (2 nodes, 1 relation)",
  graphDescriptionLabel: "Graph of semantic relations across surahs",
  viewModeGroupLabel: "Graph view mode",
  graphLabel: "Graph view",
  tableLabel: "Data table",
  emptyLabel: "No entities or relations are registered yet.",
  nodeColumnLabel: "Entity",
  categoryColumnLabel: "Category",
  surahColumnLabel: "Reference surah",
  weightColumnLabel: "Weight",
  relationColumnLabel: "Relation type",
  fromColumnLabel: "From",
  toColumnLabel: "To",
  evidenceColumnLabel: "Evidence verses",
  actionsLabel: "Actions",
  yesLabel: "Yes",
  noLabel: "No",
};

export const proofCardLabels: Pick<
  AyahProofCardProps,
  "editionName" | "proofBadgeLabel" | "digestLabel" | "copyLabel" | "copiedLabel" | "copyFailedLabel"
> = {
  editionName: "Kemenag RI",
  proofBadgeLabel: "SHA-256 provenance stamp",
  digestLabel: "Digest",
  copyLabel: "Copy verse, source, and digest",
  copiedLabel: "Copied to the clipboard.",
  copyFailedLabel: "Copying to the clipboard failed.",
};

export const proofResultLabels: Pick<
  ProofVerificationResultProps,
  | "verifiedStampLabel"
  | "mismatchStampLabel"
  | "canonicalTextLabel"
  | "submittedTextLabel"
  | "expectedHashLabel"
  | "providedHashLabel"
  | "reportLabel"
> = {
  verifiedStampLabel: "Digest recomputed on the server",
  mismatchStampLabel: "Digest does not match the canonical text",
  canonicalTextLabel: "Canonical text from the mushaf",
  submittedTextLabel: "Submitted text differs",
  expectedHashLabel: "Expected digest",
  providedHashLabel: "Submitted digest",
  reportLabel: "Verse verification report",
};

export const tilawahLabels: Pick<
  AudioTilawahPlayerProps,
  "playerLabel" | "playLabel" | "pauseLabel" | "muteLabel" | "unmuteLabel"
> = {
  playerLabel: "Tilawah playback",
  playLabel: "Play tilawah",
  pauseLabel: "Pause tilawah",
  muteLabel: "Mute",
  unmuteLabel: "Unmute",
};
