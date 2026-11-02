"use client";

import {
  ayahLocatorLimits,
  moonClient,
  type AyahProofResponseDto,
  type CorpusEditionDto,
  type VerifyAyahProofResponseDto,
} from "@moonwitness/moonclient";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  FormField,
  Input,
  ProofVerificationResult,
  SanctuaryHeader,
  Select,
  Textarea,
} from "@moonwitness/ui";
import { ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { UiMessageKey } from "ql_i18n/catalogs";
import { apiErrorMessage } from "../locale/api-error-message";
import { useTranslationCatalog } from "../locale/translation-catalog";
import { useSearchParams } from "next/navigation";

/**
 * The public proof-checking surface for Track 04.
 *
 * Nothing here computes a digest locally: the page asks the API to re-read the
 * published row (`GET /corpus/proofs/:edition/:surah/:ayah`) and to recompute
 * the claimed digest server-side (`POST /corpus/proofs/verify`). A verifier
 * that trusted the browser would be trusting the machine that may have been
 * tampered with, which is the exact failure this feature exists to detect.
 *
 * The locator bounds come from `ayahLocatorLimits` in the shared contract and
 * only gate the form; the canonical per-surah verse count is enforced by
 * `assertAyahWithinSurah` on the server.
 */
function parseLocatorPart(
  raw: string,
  min: number,
  max: number,
): number | null {
  if (raw.trim().length === 0) return null;
  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value < min || value > max) return null;
  return value;
}

function isSha256Hex(value: string): boolean {
  return (
    value.length === ayahLocatorLimits.sha256HexLength &&
    /^[0-9a-f]*$/i.test(value)
  );
}

/**
 * The API also returns `diffExplanation`, an English diagnostic sentence.
 * Outcome copy stays localized here instead of printing server prose, so the
 * four canonical statuses each pick a catalog key; the raw explanation remains
 * available to tooling on the response body.
 */
const explanationKeys = {
  verified: "web.corpus.explainVerified",
  tampered: "web.corpus.explainTampered",
  edition_mismatch: "web.corpus.explainEditionMismatch",
  not_found: "web.corpus.explainNotFound",
} as const satisfies Record<VerifyAyahProofResponseDto["status"], UiMessageKey>;

export default function VerifyAyahPage() {
  const { t } = useTranslationCatalog();
  const searchParams = useSearchParams();

  const prefill = useMemo(
    () => ({
      edition: searchParams.get("edition") ?? "",
      surah: searchParams.get("surah") ?? "",
      ayah: searchParams.get("ayah") ?? "",
      hash: searchParams.get("hash") ?? "",
    }),
    [searchParams],
  );

  const [editions, setEditions] = useState<CorpusEditionDto[]>([]);
  const [editionsLoading, setEditionsLoading] = useState(true);
  const [editionsError, setEditionsError] = useState<string | null>(null);

  const [editionKey, setEditionKey] = useState(prefill.edition);
  const [surahInput, setSurahInput] = useState(prefill.surah);
  const [ayahInput, setAyahInput] = useState(prefill.ayah);
  const [claimedHash, setClaimedHash] = useState(prefill.hash);
  const [claimedText, setClaimedText] = useState("");

  const [proof, setProof] = useState<AyahProofResponseDto | null>(null);
  const [proofLoading, setProofLoading] = useState(false);
  const [proofError, setProofError] = useState<string | null>(null);

  const [result, setResult] = useState<VerifyAyahProofResponseDto | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  // The report shows the text that was actually hashed. Reading the live
  // textarea instead would let an edit made after verification rewrite history.
  const [verifiedText, setVerifiedText] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => {
    let cancelled = false;
    setEditionsLoading(true);
    void moonClient
      .listCorpusEditions()
      .then((response) => {
        if (cancelled) return;
        setEditions(response.editions);
        setEditionsError(null);
      })
      .catch((requestError: unknown) => {
        if (cancelled) return;
        setEditionsError(apiErrorMessage(requestError, t));
        setEditions([]);
      })
      .finally(() => {
        if (!cancelled) setEditionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  // One guard instead of three: the numeric parts are parsed once, so every
  // submit path sees either a complete locator or nothing at all.
  const locator = useMemo(() => {
    const surahNumber = parseLocatorPart(
      surahInput,
      ayahLocatorLimits.surahMin,
      ayahLocatorLimits.surahMax,
    );
    const ayahNumber = parseLocatorPart(
      ayahInput,
      ayahLocatorLimits.ayahMin,
      ayahLocatorLimits.ayahMax,
    );
    if (editionKey.length === 0 || surahNumber === null || ayahNumber === null) {
      return null;
    }
    return { editionKey, surahNumber, ayahNumber };
  }, [ayahInput, editionKey, surahInput]);
  const hashReady = isSha256Hex(claimedHash);

  async function loadCanonical(event?: FormEvent) {
    if (event) event.preventDefault();
    if (locator === null) return;
    setProofLoading(true);
    setProofError(null);
    try {
      setProof(
        await moonClient.getAyahProof(
          locator.editionKey,
          locator.surahNumber,
          locator.ayahNumber,
        ),
      );
    } catch (requestError) {
      setProof(null);
      setProofError(apiErrorMessage(requestError, t));
    } finally {
      setProofLoading(false);
    }
  }

  async function verify(event?: FormEvent) {
    if (event) event.preventDefault();
    if (locator === null || !hashReady) return;
    setVerifyLoading(true);
    setVerifyError(null);
    const submittedText = claimedText.trim();
    setVerifiedText(submittedText.length > 0 ? claimedText : undefined);
    try {
      setResult(
        await moonClient.verifyAyahProof({
          surahNumber: locator.surahNumber,
          ayahNumber: locator.ayahNumber,
          editionCode: locator.editionKey,
          claimedHash,
          ...(submittedText.length > 0 ? { claimedText } : {}),
        }),
      );
    } catch (requestError) {
      setResult(null);
      setVerifyError(apiErrorMessage(requestError, t));
    } finally {
      setVerifyLoading(false);
    }
  }

  return (
    <main className="ql-hud-app relative min-h-dvh bg-panel-deep text-ink-soft">
      <SanctuaryHeader
        eyebrow={
          <span className="flex items-center gap-2">
            <span>MoonWitness · Corpus</span>
            <span>&middot;</span>
            <span>{t("web.corpus.proofPanelTitle")}</span>
          </span>
        }
        title={t("web.corpus.verifyTitle")}
        description={t("web.corpus.verifyDescription")}
      />

      <div className="mx-auto w-full max-w-4xl px-5 py-8 md:px-10 md:py-12 space-y-8">
        <form className="space-y-5" onSubmit={(event) => void loadCanonical(event)}>
          {editionsError !== null && (
            <Alert variant="error">{editionsError}</Alert>
          )}

          <FormField label={t("web.corpus.verifyEditionLabel")} htmlFor="verify-edition">
            <Select
              id="verify-edition"
              value={editionKey}
              onChange={(event) => setEditionKey(event.target.value)}
              disabled={editionsLoading || editions.length === 0}
            >
              <option value="">
                {editionsLoading
                  ? t("web.corpus.verifyLoadingEditions")
                  : t("web.corpus.verifyNoEditions")}
              </option>
              {editions.map((edition) => (
                <option key={edition.id} value={edition.edition_key}>
                  {edition.attribution_text || edition.edition_key}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label={t("web.corpus.verifySurahLabel")}
              htmlFor="verify-surah"
            >
              <Input
                id="verify-surah"
                value={surahInput}
                onChange={(event) => setSurahInput(event.target.value)}
                inputMode="numeric"
                autoComplete="off"
                required
              />
            </FormField>
            <FormField
              label={t("web.corpus.verifyAyahLabel")}
              htmlFor="verify-ayah"
            >
              <Input
                id="verify-ayah"
                value={ayahInput}
                onChange={(event) => setAyahInput(event.target.value)}
                inputMode="numeric"
                autoComplete="off"
                required
              />
            </FormField>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              variant="secondary"
              disabled={locator === null || proofLoading}
            >
              {proofLoading
                ? t("web.corpus.loadingCanonical")
                : t("web.corpus.loadCanonicalAction")}
            </Button>
            {proofError !== null && (
              <p role="alert" className="text-xs text-danger">
                {proofError}
              </p>
            )}
          </div>
        </form>

        {proof === null && !proofLoading && proofError === null && (
          <EmptyState
            icon={<ShieldCheck size={28} aria-hidden="true" />}
            title={t("web.corpus.verifyEmptyTitle")}
            description={t("web.corpus.verifyEmptyBody")}
          />
        )}

        {proof !== null && (
          <section className="space-y-4 border-t border-hairline pt-6">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="live">{t("web.corpus.sha256ProofBadge")}</Badge>
              <span className="font-mono text-ink">
                {`QS. ${proof.surahNumber}:${proof.ayahNumber}`}
              </span>
              <span className="text-muted">·</span>
              <span className="text-ink-soft">{proof.editionTitle}</span>
            </div>

            <p
              className="text-sm leading-relaxed text-ink font-display"
              dir="auto"
            >
              {proof.canonicalText}
            </p>

            <dl className="grid gap-3 border-t border-hairline pt-3 font-mono text-xs sm:grid-cols-2">
              <div>
                <dt className="text-[10px] uppercase text-muted">
                  {t("web.corpus.canonicalDigestLabel")}
                </dt>
                <dd className="break-all text-acid">{proof.authoritativeHash}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase text-muted">
                  {t("web.corpus.anchorStateLabel")}
                </dt>
                <dd className="text-ink-soft">
                  {proof.anchored
                    ? t("web.corpus.anchorPresent")
                    : t("web.corpus.anchorAbsent")}
                </dd>
              </div>
              {proof.anchorHash !== null && (
                <div>
                  <dt className="text-[10px] uppercase text-muted">
                    {t("web.corpus.anchorDigestLabel")}
                  </dt>
                  <dd className="break-all text-ink-soft">{proof.anchorHash}</dd>
                </div>
              )}
              {proof.anchored && (
                <div>
                  <dt className="text-[10px] uppercase text-muted">
                    {t("web.corpus.anchorCounterLabel")}
                  </dt>
                  <dd className="text-ink-soft">{proof.verificationCount}</dd>
                </div>
              )}
            </dl>
          </section>
        )}

        <form className="space-y-5" onSubmit={(event) => void verify(event)}>
          <FormField
            label={t("web.corpus.verifyHashLabel")}
            htmlFor="verify-hash"
            description={t("web.corpus.verifyHashHint")}
          >
            <Input
              id="verify-hash"
              value={claimedHash}
              onChange={(event) => setClaimedHash(event.target.value.trim())}
              placeholder={t("web.corpus.verifyHashPlaceholder")}
              autoComplete="off"
              spellCheck={false}
              className="font-mono"
              required
            />
          </FormField>

          <FormField
            label={t("web.corpus.verifyTextOptionalLabel")}
            htmlFor="verify-text"
          >
            <Textarea
              id="verify-text"
              value={claimedText}
              onChange={(event) => setClaimedText(event.target.value)}
              placeholder={t("web.corpus.verifyTextPlaceholder")}
              rows={4}
              dir="auto"
            />
          </FormField>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              disabled={locator === null || !hashReady || verifyLoading}
            >
              {verifyLoading
                ? t("web.corpus.verifying")
                : t("web.corpus.verifyAction")}
            </Button>
            {!hashReady && claimedHash.length > 0 && (
              <p className="text-xs text-muted">
                {t("web.corpus.verifyHashIncomplete")}
              </p>
            )}
            {verifyError !== null && (
              <p role="alert" className="text-xs text-danger">
                {verifyError}
              </p>
            )}
          </div>
        </form>

        {result !== null && (
          <section className="space-y-3 border-t border-hairline pt-6">
            <h2 className="text-sm font-semibold text-ink">
              {t("web.corpus.verifyResultTitle")}
            </h2>
            <ProofVerificationResult
              status={result.status}
              expectedHash={result.authoritativeHash}
              providedHash={claimedHash}
              canonicalText={result.canonicalText}
              submittedText={verifiedText}
              surahNumber={result.surahNumber}
              ayahNumber={result.ayahNumber}
              verifiedStampLabel={t("web.corpus.verifiedAuthenticity")}
              mismatchStampLabel={t("web.corpus.tamperedWarning")}
              canonicalTextLabel={t("web.corpus.canonicalText")}
              submittedTextLabel={t("web.corpus.submittedText")}
              expectedHashLabel={t("web.corpus.expectedHash")}
              providedHashLabel={t("web.corpus.providedHash")}
              reportLabel={t("web.corpus.verificationReport")}
            />
            <p className="text-xs leading-relaxed text-muted">
              {t(explanationKeys[result.status])}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
