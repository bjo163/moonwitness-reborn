import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import {
  loadAddons,
  QlAccessError,
  QlValidationError,
  type QlOrm,
  type QlRecord,
} from "ql_orm";
import { stubAddonManifest, withMemoryOrm } from "ql_orm/testing";
import corpusManifest from "ql_corpus/__manifest__";
import sourceManifest from "ql_source/__manifest__";
import researchManifest from "../__manifest__.js";
import {
  listLexicalCandidateReviewQueue,
  recordLexicalCandidateReview,
  type LexicalReviewQueueItem,
} from "../services/lexical-review-service.js";
import { LEXICAL_REVIEW_DECISIONS } from "./research_lexical_review.js";

const reviewer = { id: "reviewer-1", groups: ["operator"] };
const member = { id: "member-1", groups: ["user"] };
const editionKey = "mw:work:quran|ar|revelation_verbatim";

function findCandidate(
  queue: readonly LexicalReviewQueueItem[],
  normalizedForm: string,
): QlRecord | undefined {
  return queue.find(
    ({ candidate }) => candidate.normalized_form === normalizedForm,
  )?.candidate;
}

function findQueueItem(
  queue: readonly LexicalReviewQueueItem[],
  candidateId: unknown,
): LexicalReviewQueueItem | undefined {
  return queue.find(({ candidate }) => candidate.id === candidateId);
}

function findOtherQueueItem(
  queue: readonly LexicalReviewQueueItem[],
  candidateId: unknown,
): LexicalReviewQueueItem | undefined {
  return queue.find(({ candidate }) => candidate.id !== candidateId);
}

void test("research addon loads after the corpus and has no generic review writes", () => {
  const sorted = loadAddons([
    researchManifest,
    corpusManifest,
    sourceManifest,
    stubAddonManifest("ql_auth"),
    stubAddonManifest("ql_base"),
  ]);
  const order = sorted.map((manifest) => manifest.name);
  assert.ok(order.indexOf("ql_source") < order.indexOf("ql_corpus"));
  assert.ok(order.indexOf("ql_corpus") < order.indexOf("ql_research"));

  const access = researchManifest.access.filter(
    (rule) => rule.model === "research.lexical_review",
  );
  assert.ok(access.length > 0);
  assert.ok(
    access.every(
      (rule) => rule.read && !rule.write && !rule.create && !rule.unlink,
    ),
  );
  assert.equal(
    researchManifest.models[0].fields.reviewer_id.private,
    true,
  );
  assert.equal(
    researchManifest.models[0].fields.candidate_text,
    undefined,
    "reviews must not persist source-derived candidate text",
  );
});

async function seedPublishedFixture(orm: QlOrm) {
  const work = await orm.createRecordForService("corpus.work", {
    canonical_id: "mw:work:review-fixture",
    title: "Review fixture",
    work_kind: "revelation",
    primary_locale: "ar",
  });
  const artifact = await orm.createRecordForService("source.artifact", {
    canonical_id: "mw:dataset:review-fixture",
    title: "Licensed review fixture",
    kind: "revealed_text",
    owner_id: "seed-user",
  });
  const version = await orm.createRecordForService("source.version", {
    artifact_id: String(artifact.id),
    version_key: `${String(artifact.id)}@v1`,
    release_label: "fixture-v1",
    row_count_expected: 2,
    acquired_at: new Date(),
    method: "test fixture",
    owner_id: "seed-user",
  });
  let displayRightsId = "";
  for (const action of ["display", "transform"]) {
    const rights = await orm.createRecordForService("source.rights", {
      version_id: String(version.id),
      rights_key: `${String(version.id)}|${action}`,
      action,
      rights_status: "cleared",
      attribution_text: "Fixture source attribution",
      owner_id: "seed-user",
    });
    if (action === "display") displayRightsId = String(rights.id);
  }
  const edition = await orm.createRecordForService("corpus.edition", {
    canonical_id: "mw:edition:review-fixture",
    work_id: String(work.id),
    source_version_id: String(version.id),
    rights_id: displayRightsId,
    edition_key: editionKey,
    authority: "revelation_verbatim",
    locale: "ar",
    attribution_text: "Fixture source attribution",
    publisher: "Fixture publisher",
    imported_row_count: 2,
  });
  const texts = ["الرَّحْمَٰنُ", "الرَّحْمَٰنُ الرَّحِيمُ"];
  for (const [index, text] of texts.entries()) {
    const ayah = index + 1;
    await orm.createRecordForService("corpus.passage", {
      canonical_id: `mw:passage:review-fixture:${ayah}`,
      edition_id: String(edition.id),
      work_id: String(work.id),
      authority: "revelation_verbatim",
      locator: `1:${ayah}`,
      passage_key: `${String(edition.id)}|1:${ayah}`,
      surah: 1,
      ayah,
      row_kind: "ayah",
      text,
      text_checksum: createHash("sha256").update(text, "utf8").digest("hex"),
      ordinal: ayah,
      import_run_id: "research-review-test",
    });
  }
  const { publishEdition } = await import("ql_corpus/services/corpus-service");
  await publishEdition(orm, reviewer, editionKey);
}

void test("review queue re-computes source evidence and writes an immutable, private audit", async () => {
  await withMemoryOrm(
    [
      stubAddonManifest("ql_base"),
      stubAddonManifest("ql_auth"),
      sourceManifest,
      corpusManifest,
      researchManifest,
    ],
    async (orm) => {
      await seedPublishedFixture(orm);
      const queue = await listLexicalCandidateReviewQueue(orm, reviewer, editionKey);
      const rahman = findQueueItem(queue, findCandidate(queue, "الرحمن")?.id);
      if (!rahman) throw new Error("The normalized lexical candidate is missing.");
      assert.equal(rahman.review, null);
      assert.equal(rahman.candidate.occurrence_count, 2);

      const assessment = await recordLexicalCandidateReview(
        orm,
        reviewer,
        String(rahman.candidate.id),
        {
          editionKey,
          normalizedForm: String(rahman.candidate.normalized_form),
          decision: "retain_for_research",
          rationale: "Keep for a separate, expert-led linguistic review.",
        },
      );
      assert.equal(assessment.reviewer_id, reviewer.id);
      assert.equal(assessment.candidate_text, undefined);
      assert.equal(assessment.normalized_form, undefined);
      assert.match(String(assessment.source_reference_digest), /^[a-f0-9]{64}$/u);

      const refreshed = await listLexicalCandidateReviewQueue(
        orm,
        reviewer,
        editionKey,
      );
      const reviewed = findQueueItem(refreshed, rahman.candidate.id);
      assert.equal(reviewed?.review?.id, assessment.id);
      assert.equal(reviewed?.review?.decision, "retain_for_research");
      assert.equal(findOtherQueueItem(refreshed, rahman.candidate.id)?.review, null);

      const visible = await orm.findMany("research.lexical_review", reviewer, 20);
      assert.equal("reviewer_id" in (visible[0] ?? {}), false);
      await assert.rejects(
        orm.findMany("research.lexical_review", member, 20),
        QlAccessError,
      );
    },
  );
});

void test("review service refuses unauthorized actors, invalid decisions, and stale candidate snapshots", async () => {
  await withMemoryOrm(
    [
      stubAddonManifest("ql_base"),
      stubAddonManifest("ql_auth"),
      sourceManifest,
      corpusManifest,
      researchManifest,
    ],
    async (orm) => {
      await seedPublishedFixture(orm);
      await assert.rejects(
        listLexicalCandidateReviewQueue(orm, member, editionKey),
        QlAccessError,
      );
      const queue = await listLexicalCandidateReviewQueue(orm, reviewer, editionKey);
      const candidate = queue[0]?.candidate;
      if (candidate === undefined) {
        throw new Error("The review fixture returned no candidates.");
      }

      await assert.rejects(
        recordLexicalCandidateReview(orm, reviewer, String(candidate.id), {
          editionKey,
          normalizedForm: String(candidate.normalized_form),
          decision: "theologically_verified",
          rationale: "Not an allowed review decision.",
        }),
        QlValidationError,
      );
      await assert.rejects(
        recordLexicalCandidateReview(orm, reviewer, "f".repeat(64), {
          editionKey,
          normalizedForm: String(candidate.normalized_form),
          decision: LEXICAL_REVIEW_DECISIONS[0],
          rationale: "The snapshot is no longer available.",
        }),
        /no longer available/u,
      );
      const staleCandidateId = String(candidate.id);
      const updatedVersionId = "fixture-source-version-v2";
      await orm.createRecordForService("source.rights", {
        version_id: updatedVersionId,
        rights_key: `${updatedVersionId}|transform`,
        action: "transform",
        rights_status: "cleared",
        attribution_text: "Fixture source attribution",
        owner_id: "seed-user",
      });
      await orm.updateRecordsForService(
        "corpus.edition",
        { edition_key: editionKey },
        { source_version_id: updatedVersionId },
      );
      await assert.rejects(
        recordLexicalCandidateReview(orm, reviewer, staleCandidateId, {
          editionKey,
          normalizedForm: String(candidate.normalized_form),
          decision: LEXICAL_REVIEW_DECISIONS[0],
          rationale: "The source version changed after the candidate was read.",
        }),
        /no longer available/u,
      );
      const rows = await orm.findManyByService("research.lexical_review", {}, {
        limit: 20,
      });
      assert.equal(rows.length, 0);
    },
  );
});

void test("review queue fails closed at the bounded history limit", async () => {
  await withMemoryOrm(
    [
      stubAddonManifest("ql_base"),
      stubAddonManifest("ql_auth"),
      sourceManifest,
      corpusManifest,
      researchManifest,
    ],
    async (orm) => {
      await seedPublishedFixture(orm);
      for (let index = 0; index < 500; index += 1) {
        await orm.createRecordForService("research.lexical_review", {
          candidate_id: index.toString(16).padStart(64, "0"),
          edition_key: editionKey,
          source_version_id: "fixture-version",
          normalization_version: "test-normalizer-v1",
          algorithm_version: "test-extractor-v1",
          occurrence_count: 1,
          verse_reference_count: 1,
          source_references: "[]",
          source_reference_digest: createHash("sha256")
            .update("[]", "utf8")
            .digest("hex"),
          decision: "retain_for_research",
          rationale: `Fixture assessment ${index}`,
          reviewer_id: reviewer.id,
          reviewed_at: new Date(index),
        });
      }
      await assert.rejects(
        listLexicalCandidateReviewQueue(orm, reviewer, editionKey),
        /500-record safety limit/u,
      );
    },
  );
});

void test("witness.statement is registered in ql_research and validates transmission chain", async () => {
  await withMemoryOrm(
    [
      stubAddonManifest("ql_base"),
      stubAddonManifest("ql_auth"),
      sourceManifest,
      corpusManifest,
      researchManifest,
    ],
    async (orm) => {
      const record = await orm.createRecordForService("witness.statement", {
        canonical_id: "mw:witness:hadith-jibril-umar",
        witness_name: "Umar ibn al-Khattab",
        person_id: "mw:person:umar",
        source_artifact_id: "mw:source:muslim-sahih-1",
        statement: "While we were one day sitting with the Messenger of Allah, there appeared before us a man with very white clothing and very black hair...",
        time_context: "Medina, late prophetic era",
        place_context: "Prophet's Mosque, Medina",
        transmission_chain: "Yahya ibn Ya'mar -> Abdullah ibn Umar -> Umar ibn al-Khattab",
        chain_of_custody: "Transmitted via verified continuous isnad (Muttasil)",
        has_broken_chain: false,
        reliability_assessment: "corroborated",
        consent_status: "public_tradition",
        created_at: new Date(),
        updated_at: new Date(),
      });
      assert.ok(record.id);

      const found = await orm.findOneByService("witness.statement", { id: record.id });
      assert.equal(found?.["witness_name"], "Umar ibn al-Khattab");
      assert.equal(found?.["has_broken_chain"], false);
      assert.equal(found?.["reliability_assessment"], "corroborated");
    },
  );
});


void test("story.narrative is registered in ql_research and preserves fictional vs historical distinction", async () => {
  await withMemoryOrm(
    [
      stubAddonManifest("ql_base"),
      stubAddonManifest("ql_auth"),
      sourceManifest,
      corpusManifest,
      researchManifest,
    ],
    async (orm) => {
      const story = await orm.createRecordForService("story.narrative", {
        canonical_id: "mw:story:ashab-al-kahf",
        title: "The Companions of the Cave",
        story_mode: "religious_interpretation",
        tradition: "Abrahamic / Quranic",
        summary: "The narrative of the faithful youth who sought refuge in a cave from oppressive tyranny.",
        motifs: "cave, miraculous sleep, divine protection, youth, monotheism",
        source_artifact_id: "mw:source:quran",
        passage_id: "mw:passage:18:9-26",
        is_fictional: false,
        created_at: new Date(),
        updated_at: new Date(),
      });
      assert.ok(story.id);

      const found = await orm.findOneByService("story.narrative", { id: story.id });
      assert.equal(found?.["title"], "The Companions of the Cave");
      assert.equal(found?.["story_mode"], "religious_interpretation");
      assert.equal(found?.["is_fictional"], false);
    },
  );
});


void test("event.record is registered in ql_research and preserves epistemic status", async () => {
  await withMemoryOrm(
    [
      stubAddonManifest("ql_base"),
      stubAddonManifest("ql_auth"),
      sourceManifest,
      corpusManifest,
      researchManifest,
    ],
    async (orm) => {
      const event = await orm.createRecordForService("event.record", {
        canonical_id: "mw:event:battle-of-badr",
        title: "Battle of Badr",
        summary: "The key military engagement between early Muslims and the Quraysh of Mecca.",
        temporal_context: "17 Ramadan, 2 AH (March 624 CE)",
        location: "Badr, Hejaz",
        country_code: "SA",
        participants: "Early Muslim community led by Prophet Muhammad; Quraysh confederacy",
        epistemic_status: "established_fact",
        competing_accounts: "Consensus across Islamic historiography and early Arabic chronicles",
        uncertainty_notes: "Minor tactical discrepancies in secondary transmission lines",
        source_artifact_id: "mw:source:seerah-ibn-hisham",
        created_at: new Date(),
        updated_at: new Date(),
      });
      assert.ok(event.id);

      const found = await orm.findOneByService("event.record", { id: event.id });
      assert.equal(found?.["title"], "Battle of Badr");
      assert.equal(found?.["epistemic_status"], "established_fact");
      assert.equal(found?.["country_code"], "SA");
    },
  );
});


void test("person.profile is registered in ql_research and validates role attribution", async () => {
  await withMemoryOrm(
    [
      stubAddonManifest("ql_base"),
      stubAddonManifest("ql_auth"),
      sourceManifest,
      corpusManifest,
      researchManifest,
    ],
    async (orm) => {
      const person = await orm.createRecordForService("person.profile", {
        canonical_id: "mw:person:al-bukhari",
        primary_name: "Muhammad ibn Ismail al-Bukhari",
        aliases: "Imam Bukhari, Abu Abdillah",
        primary_role: "scholar",
        era_context: "194 - 256 AH (810 - 870 CE)",
        biographical_summary: "Major 9th-century Islamic scholar and master muhaddith, compiler of Sahih al-Bukhari.",
        attribution_notes: "Primary biographical entries verified in Siyar A'lam al-Nubala and Tahdhib al-Kamal",
        source_artifact_id: "mw:source:tahdhib-al-kamal",
        created_at: new Date(),
        updated_at: new Date(),
      });
      assert.ok(person.id);

      const found = await orm.findOneByService("person.profile", { id: person.id });
      assert.equal(found?.["primary_name"], "Muhammad ibn Ismail al-Bukhari");
      assert.equal(found?.["primary_role"], "scholar");
    },
  );
});

void test("law.instrument is registered in ql_research and validates jurisdiction boundaries", async () => {
  await withMemoryOrm(
    [
      stubAddonManifest("ql_base"),
      stubAddonManifest("ql_auth"),
      sourceManifest,
      corpusManifest,
      researchManifest,
    ],
    async (orm) => {
      const law = await orm.createRecordForService("law.instrument", {
        canonical_id: "mw:law:medina-charter",
        title: "Charter of Medina",
        jurisdiction: "islamic_classical",
        instrument_type: "treaty",
        issuing_authority: "Prophet Muhammad",
        promulgation_date: "622 CE",
        operative_scope: "Constitutional pact establishing rights and duties for Medina communities",
        summary: "Historical pact establishing mutual cooperation and defense in Medina.",
        source_reference: "Sirat Rasul Allah, Ibn Ishaq",
        is_binding: true,
        created_at: new Date(),
        updated_at: new Date(),
      });
      assert.ok(law.id);

      const found = await orm.findOneByService("law.instrument", { id: law.id });
      assert.equal(found?.["title"], "Charter of Medina");
      assert.equal(found?.["jurisdiction"], "islamic_classical");
      assert.equal(found?.["instrument_type"], "treaty");
      assert.equal(found?.["is_binding"], true);
    },
  );
});

void test("mizan.assessment is registered in ql_research and validates rubric balance dimensions", async () => {
  await withMemoryOrm(
    [
      stubAddonManifest("ql_base"),
      stubAddonManifest("ql_auth"),
      sourceManifest,
      corpusManifest,
      researchManifest,
    ],
    async (orm) => {
      const assessment = await orm.createRecordForService("mizan.assessment", {
        canonical_id: "mw:mizan:badr-hadith-authenticity",
        target_entity_type: "witness.statement",
        target_entity_id: "mw:witness:hadith-badr-01",
        rubric_version: "mizan_v1.2",
        primary_dimension: "isnad_authenticity",
        balance_tier: "sahih_rigorous",
        weight_score: 94,
        evaluator_context: "Critical evaluation of transmitter chain unbrokenness and dabt",
        rationalization: "All narrators in this chain are documented as thiqah (trustworthy) and muttasil (unbroken) in classical rijāl compendia.",
        contestation_notes: "Minor stylistic variant notes reported in secondary transmission branches.",
        created_at: new Date(),
        updated_at: new Date(),
      });
      assert.ok(assessment.id);

      const found = await orm.findOneByService("mizan.assessment", { id: assessment.id });
      assert.equal(found?.["target_entity_type"], "witness.statement");
      assert.equal(found?.["primary_dimension"], "isnad_authenticity");
      assert.equal(found?.["balance_tier"], "sahih_rigorous");
      assert.equal(found?.["weight_score"], 94);
    },
  );
});
