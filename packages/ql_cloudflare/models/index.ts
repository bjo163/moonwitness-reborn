import type { QlModelDefinition } from "ql_orm";
import { cloudflareRecord } from "./cloudflare_record.js";
import { cloudflareZone } from "./cloudflare_zone.js";

export const models: QlModelDefinition[] = [cloudflareZone, cloudflareRecord];
