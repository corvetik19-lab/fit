type WebSearchResult = {
  snippet: string;
  title: string;
  url: string;
};

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function stripTags(value: string) {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function resolveDuckDuckGoUrl(rawHref: string) {
  const normalizedHref = rawHref.startsWith("//")
    ? `https:${rawHref}`
    : rawHref;

  try {
    const parsed = new URL(normalizedHref);
    const redirected = parsed.searchParams.get("uddg");

    return redirected ? decodeURIComponent(redirected) : normalizedHref;
  } catch {
    return normalizedHref;
  }
}

export async function searchWebSnippets(query: string): Promise<WebSearchResult[]> {
  const response = await fetch(
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
    {
      headers: {
        "User-Agent": "fit-ai-assistant/1.0",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Web search failed with status ${response.status}`);
  }

  const html = await response.text();
  const blocks = html.split('<div class="result results_links');
  const results: WebSearchResult[] = [];

  for (const block of blocks) {
    if (results.length >= 5) {
      break;
    }

    const linkMatch = block.match(
      /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i,
    );

    if (!linkMatch) {
      continue;
    }

    const snippetMatch = block.match(
      /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i,
    );

    const url = resolveDuckDuckGoUrl(linkMatch[1]);
    const title = stripTags(linkMatch[2]);
    const snippet = stripTags(snippetMatch?.[1] ?? "");

    if (!title || !url) {
      continue;
    }

    results.push({
      title,
      url,
      snippet,
    });
  }

  return results;
}
