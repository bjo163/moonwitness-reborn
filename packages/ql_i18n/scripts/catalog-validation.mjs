function placeholders(value) {
  return [...value.matchAll(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g)]
    .map((match) => match[1])
    .sort();
}

function assertPlaceholders(context, source, translated, locale) {
  if (
    JSON.stringify(placeholders(source)) !==
    JSON.stringify(placeholders(translated))
  ) {
    throw new Error(
      `PO message '${context}' does not preserve placeholders in '${locale}'.`,
    );
  }
}

export function validatePoMessage(locale, context, message, categories) {
  if (message.msgid_plural) {
    if (
      JSON.stringify(placeholders(message.msgid)) !==
      JSON.stringify(placeholders(message.msgid_plural))
    ) {
      throw new Error(
        `PO plural message '${context}' has incompatible source placeholders.`,
      );
    }

    const forms = Object.fromEntries(
      categories.map((category, index) => [
        category,
        message.msgstr[index] ?? "",
      ]),
    );
    for (const category of categories) {
      const translated = forms[category];
      if (typeof translated !== "string" || !translated.trim()) {
        throw new Error(
          `PO plural message '${context}' has a missing '${category}' translation in '${locale}'.`,
        );
      }
      assertPlaceholders(context, message.msgid_plural, translated, locale);
    }
    return { plural: forms };
  }

  const translated = message.msgstr[0] ?? "";
  if (!translated.trim()) {
    throw new Error(
      `PO message '${context}' has an empty translation in '${locale}'.`,
    );
  }
  assertPlaceholders(context, message.msgid, translated, locale);
  return translated;
}
