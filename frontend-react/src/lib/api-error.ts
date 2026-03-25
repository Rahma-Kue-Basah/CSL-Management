"use client";

export function extractApiErrorMessage(
  data: unknown,
  fallback: string,
  prioritizedKeys: string[] = [],
) {
  if (Array.isArray(data) && typeof data[0] === "string") {
    return data[0];
  }

  if (!data || typeof data !== "object") {
    return fallback;
  }

  const typed = data as Record<string, unknown>;

  if (typeof typed.detail === "string" && typed.detail.trim()) {
    return typed.detail;
  }

  if (
    Array.isArray(typed.non_field_errors) &&
    typeof typed.non_field_errors[0] === "string"
  ) {
    return typed.non_field_errors[0];
  }

  for (const key of prioritizedKeys) {
    const value = typed[key];
    if (Array.isArray(value) && typeof value[0] === "string") {
      return value[0];
    }
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  for (const value of Object.values(typed)) {
    if (Array.isArray(value) && typeof value[0] === "string") {
      return value[0];
    }
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return fallback;
}

export function extractApiErrorMessageFromText(
  text: string,
  fallback: string,
) {
  const normalizedText = text.trim();
  if (!normalizedText) {
    return fallback;
  }

  const exceptionValueMatch = normalizedText.match(
    /Exception Value:\s*([\s\S]*?)\s*(?:Exception Location:|Raised during:|Request Method:|Request URL:)/i,
  );
  if (exceptionValueMatch?.[1]) {
    return cleanExtractedError(exceptionValueMatch[1]);
  }

  const detailMatch = normalizedText.match(/"detail"\s*:\s*"([^"]+)"/i);
  if (detailMatch?.[1]) {
    return detailMatch[1].trim();
  }

  const arrayMatch = normalizedText.match(/\[\s*['"]([^'"]+)['"]\s*\]/);
  if (arrayMatch?.[1]) {
    return arrayMatch[1].trim();
  }

  return fallback;
}

function cleanExtractedError(raw: string) {
  return decodeHtmlEntities(
    raw
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim(),
  );
}

function decodeHtmlEntities(value: string) {
  if (typeof document === "undefined") {
    return value
      .replace(/&#x27;/gi, "'")
      .replace(/&#39;/gi, "'")
      .replace(/&quot;/gi, '"')
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">");
  }

  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
}
