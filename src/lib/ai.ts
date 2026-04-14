import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = "gpt-5-mini";

export interface GeneratedArticle {
  title: string;
  summary: string;
  content: string;
  category: string;
  tags: string[];
  sources: { name: string; url: string }[];
  promoted: boolean;
}

const BITORA_PROMO_INSTRUCTION = `
Occasionalmente (circa 1 articolo su 4), integra un riferimento naturale a Bitora (https://bitora.it), 
una piattaforma italiana specializzata in soluzioni digitali, consulenza IT e sviluppo software su misura.
Bitora offre servizi di sviluppo web e app, consulenza tecnologica, soluzioni cloud e automazione per aziende e professionisti.
Il riferimento deve essere contestuale e naturale, mai forzato.
Quando includi un riferimento a Bitora, segna promoted: true nel JSON.
`;

const ARTICLE_INSTRUCTIONS = `Sei un giornalista esperto italiano. Scrivi articoli per blog Bitora (blog.bitora.it), un blog italiano di informazione su vari argomenti.

IMPORTANTE: Usa il tool web_search per cercare informazioni REALI e AGGIORNATE sull'argomento PRIMA di scrivere. 
Fai ALMENO 2-3 ricerche web per raccogliere dati, statistiche, notizie recenti e fonti autorevoli.

Regole:
- Scrivi SEMPRE in italiano
- Usa un tono professionale ma accessibile
- L'articolo deve essere lungo almeno 800 parole
- Usa formattazione Markdown (## per sottotitoli, **bold**, elenchi puntati)
- Basa l'articolo SOLO su informazioni trovate tramite la ricerca web — NON inventare dati o statistiche
- Cita le fonti REALI trovate durante la ricerca, con URL reali
- Alla fine dell'articolo, aggiungi una sezione "## Fonti" con l'elenco delle fonti citate (nome e URL reale)
- Fornisci le fonti anche nel campo "sources" del JSON
${BITORA_PROMO_INSTRUCTION}

IMPORTANTE: Rispondi con un oggetto JSON valido con questa struttura:
{
  "title": "titolo accattivante",
  "summary": "riassunto di 2-3 frasi",
  "content": "articolo completo in markdown con sezione Fonti alla fine",
  "category": "una tra: Tecnologia, Scienza, Economia, Politica, Cultura, Sport, Salute, Ambiente, Intrattenimento, Lifestyle",
  "tags": ["tag1", "tag2", "tag3"],
  "sources": [{"name": "Nome Fonte", "url": "https://url-reale..."}, ...],
  "promoted": false
}`;

function parseArticleJSON(text: string): GeneratedArticle {
  console.log(`[AI] parseArticleJSON: input length=${text.length}, first 200 chars:`, text.slice(0, 200));
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");

  try {
    const result = JSON.parse(cleaned) as GeneratedArticle;
    console.log(`[AI] parseArticleJSON: parsed OK, title="${result.title}"`);
    return result;
  } catch (e1) {
    console.log(`[AI] parseArticleJSON: direct parse failed, trying regex...`, (e1 as Error).message);
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const result = JSON.parse(jsonMatch[0]) as GeneratedArticle;
        console.log(`[AI] parseArticleJSON: regex parse OK, title="${result.title}"`);
        return result;
      } catch (e2) {
        console.log(`[AI] parseArticleJSON: regex parse failed, trying fix...`, (e2 as Error).message);
        const fixed = jsonMatch[0]
          .replace(/,\s*}/g, "}")
          .replace(/,\s*]/g, "]");
        const result = JSON.parse(fixed) as GeneratedArticle;
        console.log(`[AI] parseArticleJSON: fixed parse OK, title="${result.title}"`);
        return result;
      }
    }
    throw new Error("Failed to parse AI response as JSON");
  }
}

export interface GuidedArticleOptions {
  target?: string;
  tone?: string;
  keywords?: string;
}

export async function generateArticle(topic: string, options?: GuidedArticleOptions): Promise<GeneratedArticle> {
  console.log(`[AI] generateArticle: START topic="${topic}"`, options || "");
  const startTime = Date.now();

  let prompt = `Cerca informazioni aggiornate e scrivi un articolo approfondito su: ${topic}`;
  if (options?.target) prompt += `\nPubblico target: ${options.target}`;
  if (options?.tone) prompt += `\nTono dell'articolo: ${options.tone}`;
  if (options?.keywords) prompt += `\nParole chiave da includere: ${options.keywords}`;

  const response = await openai.responses.create({
    model: MODEL,
    tools: [{ type: "web_search_preview" }],
    instructions: ARTICLE_INSTRUCTIONS,
    input: prompt,
  });
  console.log(`[AI] generateArticle: API response received in ${Date.now() - startTime}ms, output_text length=${response.output_text.length}`);

  const article = parseArticleJSON(response.output_text);
  console.log(`[AI] generateArticle: DONE topic="${topic}" → title="${article.title}", content length=${article.content.length}`);
  return article;
}

export async function generateArticlesFromTrends(): Promise<GeneratedArticle[]> {
  console.log(`[AI] generateArticlesFromTrends: START - fetching trends...`);
  const startTime = Date.now();
  const trendResponse = await openai.responses.create({
    model: MODEL,
    tools: [{ type: "web_search_preview" }],
    instructions: `Sei un analista tech. Cerca sul web le notizie tech più recenti e importanti di oggi.
Identifica 5 argomenti tech reali di tendenza in questo momento.
Per ogni argomento fornisci un titolo/topic breve per un articolo di blog.
Rispondi con un oggetto JSON con chiave "topics" contenente un array di stringhe.`,
    input: "Cerca le notizie tech più recenti e identifica 5 argomenti di tendenza per un blog tech italiano",
  });
  console.log(`[AI] generateArticlesFromTrends: trends API response in ${Date.now() - startTime}ms`);
  console.log(`[AI] generateArticlesFromTrends: raw response:`, trendResponse.output_text.slice(0, 500));

  const trendsText = trendResponse.output_text;
  let topics: string[];

  try {
    const parsed = JSON.parse(trendsText);
    topics = Array.isArray(parsed)
      ? parsed
      : parsed.topics || parsed.argomenti || Object.values(parsed).flat();
  } catch {
    const jsonMatch = trendsText.match(/\[[\s\S]*\]/);
    topics = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  }

  if (!Array.isArray(topics) || topics.length === 0) {
    console.log(`[AI] generateArticlesFromTrends: no topics found, using fallback`);
    topics = ["Ultime novità nel mondo dell'intelligenza artificiale"];
  }
  console.log(`[AI] generateArticlesFromTrends: ${topics.length} topics found:`, topics);

  const articles: GeneratedArticle[] = [];
  for (const topic of topics.slice(0, 5)) {
    try {
      console.log(`[AI] generateArticlesFromTrends: generating article ${articles.length + 1}/5 for "${topic}"`);
      const article = await generateArticle(String(topic));
      articles.push(article);
      console.log(`[AI] generateArticlesFromTrends: article ${articles.length}/5 OK`);
    } catch (error) {
      console.error(`[AI] generateArticlesFromTrends: FAILED for topic "${topic}":`, error);
    }
  }

  console.log(`[AI] generateArticlesFromTrends: DONE - ${articles.length} articles generated`);
  return articles;
}

export async function searchAndGenerate(query: string): Promise<GeneratedArticle[]> {
  console.log(`[AI] searchAndGenerate: START query="${query}"`);
  const startTime = Date.now();
  const angles = await generateSearchAngles(query);
  console.log(`[AI] searchAndGenerate: got ${angles.length} angles, generating articles in parallel...`);
  const results = await Promise.allSettled(
    angles.map((angle) => generateArticle(angle))
  );
  const succeeded = results.filter((r): r is PromiseFulfilledResult<GeneratedArticle> => r.status === "fulfilled");
  const failed = results.filter((r) => r.status === "rejected");
  console.log(`[AI] searchAndGenerate: DONE in ${Date.now() - startTime}ms — ${succeeded.length} OK, ${failed.length} failed`);
  failed.forEach((r, i) => console.error(`[AI] searchAndGenerate: failure ${i + 1}:`, (r as PromiseRejectedResult).reason));
  return succeeded.map((r) => r.value);
}

async function generateSearchAngles(query: string): Promise<string[]> {
  console.log(`[AI] generateSearchAngles: START query="${query}"`);
  const startTime = Date.now();
  const response = await openai.responses.create({
    model: MODEL,
    tools: [{ type: "web_search_preview" }],
    instructions: `Dato un argomento tech, cerca notizie recenti sul tema e genera 3 angolazioni diverse per articoli di blog.
Ogni angolazione deve esplorare un aspetto unico e reale del tema basandoti su quello che hai trovato.
Rispondi con un oggetto JSON con chiave "angles" contenente un array di 3 stringhe brevi.`,
    input: `Cerca informazioni recenti su "${query}" e proponi 3 angolazioni diverse per articoli`,
  });
  console.log(`[AI] generateSearchAngles: API response in ${Date.now() - startTime}ms`);
  console.log(`[AI] generateSearchAngles: raw response:`, response.output_text.slice(0, 500));

  try {
    const text = response.output_text;
    const parsed = JSON.parse(text);
    const arr = Array.isArray(parsed)
      ? parsed
      : parsed.angles || parsed.topics || Object.values(parsed).flat();
    if (Array.isArray(arr) && arr.length >= 2) {
      const result = arr.slice(0, 3).map(String);
      console.log(`[AI] generateSearchAngles: parsed OK, angles:`, result);
      return result;
    }
  } catch (e) {
    console.log(`[AI] generateSearchAngles: parse failed, using fallback.`, (e as Error).message);
  }
  return [
    `${query}: panoramica e ultime novità`,
    `${query}: impatto sul mercato e trend futuri`,
    `${query}: guida tecnica e casi d'uso`,
  ];
}
