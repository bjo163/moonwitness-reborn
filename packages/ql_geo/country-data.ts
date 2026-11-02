import type { QlSeedDataRecord } from "ql_orm";
import { countries } from "./countries.js";

export const countryData: QlSeedDataRecord[] = countries.map(
  ({ code, name }) => ({
    id: `country_${code.toLowerCase()}`,
    model: "res.country",
    key: { field: "code", value: code },
    values: { code, name },
    updatePolicy: "reconcile",
  }),
);
