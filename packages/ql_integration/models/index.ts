import type { QlModelDefinition } from "ql_orm";
import { integrationAudit } from "./integration_audit.js";
import { integrationConnector } from "./integration_connector.js";

export const models: QlModelDefinition[] = [integrationConnector, integrationAudit];
