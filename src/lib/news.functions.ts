import { createServerFn } from "@tanstack/react-start";

export type NewsItem = { title: string; link: string; source: string; pubDate?: string };

const FEEDS: { url: string; source: string }[] = [
  { url: "https://www.meioemensagem.com.br/feed", source: "Meio & Mensagem" },
  { url: "https://exame.com/feed/", source: "Exame" },
  { url: "https://www.adnews.com.br/feed", source: "Adnews" },
];

function decode(s: string) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function parseRss(xml: string, source: string, max = 5): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item[\s>][\s\S]*?<\/item>/g;
  const blocks = xml.match(itemRegex) ?? [];
  for (const block of blocks) {
    const title = decode(block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "");
    const link = decode(block.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? "");
    const pubDate = decode(block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? "");
    if (title && link) items.push({ title, link, source, pubDate });
    if (items.length >= max) break;
  }
  return items;
}

const KEYWORDS = /marketing|tr[aá]fego|m[ií]dia|publicidad|propaganda|ads|google|meta|facebook|instagram|tiktok|seo|performance|funil|lead|conver|branding|campanha/i;

export const getMarketingNews = createServerFn({ method: "GET" }).handler(async () => {
  const all: NewsItem[] = [];
  await Promise.all(
    FEEDS.map(async (f) => {
      try {
        const res = await fetch(f.url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; MonkeysCRM/1.0)" },
        });
        if (!res.ok) return;
        const xml = await res.text();
        all.push(...parseRss(xml, f.source, 6));
      } catch {
        // ignore
      }
    }),
  );

  const filtered = all.filter((i) => KEYWORDS.test(i.title));
  const pool = filtered.length >= 5 ? filtered : all;
  pool.sort((a, b) => {
    const ta = a.pubDate ? Date.parse(a.pubDate) : 0;
    const tb = b.pubDate ? Date.parse(b.pubDate) : 0;
    return tb - ta;
  });
  return { items: pool.slice(0, 6) };
});
