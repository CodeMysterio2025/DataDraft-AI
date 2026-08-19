const clean = value => String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const title = work => clean(work.title || work.display_name || "Untitled work");
const year = work => work.publication_year || work.published?.['date-parts']?.[0]?.[0] || "n.d.";
const doiUrl = work => work.doi ? (work.doi.startsWith("http") ? work.doi : `https://doi.org/${work.doi}`) : work.primary_location?.landing_page_url || work.URL || "";
async function getJson(url) { const response = await fetch(url, { headers: { "User-Agent": "Prism-AI-Scientific-Research/1.0" }, signal: AbortSignal.timeout(9000) }); if (!response.ok) throw new Error(`Research service returned ${response.status}`); return response.json(); }
async function searchScience(question) {
  const query = encodeURIComponent(question.slice(0, 300));
  const [openAlex, crossref] = await Promise.allSettled([getJson(`https://api.openalex.org/works?search=${query}&per-page=4&select=id,title,publication_year,doi,cited_by_count,primary_location`), getJson(`https://api.crossref.org/works?query=${query}&rows=4&select=DOI,title,published,container-title,URL,is-referenced-by-count`)]);
  const works = [];
  if (openAlex.status === "fulfilled") for (const item of openAlex.value.results || []) works.push({ title: title(item), year: year(item), doi: doiUrl(item), venue: clean(item.primary_location?.source?.display_name), citedBy: item.cited_by_count || 0, source: "OpenAlex" });
  if (crossref.status === "fulfilled") for (const item of crossref.value.message?.items || []) works.push({ title: title(item), year: year(item), doi: doiUrl(item), venue: clean(item['container-title']?.[0]), citedBy: item['is-referenced-by-count'] || 0, source: "Crossref" });
  const unique = [...new Map(works.filter(work => work.doi || work.title !== "Untitled work").map(work => [work.doi || work.title.toLowerCase(), work])).values()].sort((a, b) => b.citedBy - a.citedBy).slice(0, 5);
  if (!unique.length) throw new Error("No matching scientific records were found. Try a more specific research question.");
  return unique;
}
module.exports = { searchScience };
