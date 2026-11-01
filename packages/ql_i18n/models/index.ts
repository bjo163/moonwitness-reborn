import type { QlModelDefinition } from "ql_orm";
import { i18nLanguage } from "./i18n_language.js";
import { i18nTranslation } from "./i18n_translation.js";

export const models: QlModelDefinition[] = [i18nLanguage, i18nTranslation];
