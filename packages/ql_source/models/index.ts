import type { QlModelDefinition } from "ql_orm";
import { sourceArtifact } from "./source_artifact.js";
import { sourceProvenance } from "./source_provenance.js";
import { sourceRights } from "./source_rights.js";
import { sourceVersion } from "./source_version.js";

export const models: QlModelDefinition[] = [
  sourceArtifact,
  sourceVersion,
  sourceRights,
  sourceProvenance,
];
