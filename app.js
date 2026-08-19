const el = selector => document.querySelector(selector);
const recents = el("#recents"), prompt = el("#prompt"), form = el("#composer"), conversation = el("#conversation"), empty = el("#empty"), send = el("#send"), status = el("#status"), accountLabel = el("#account-label"), googleSlot = el("#google-slot");
let chats = JSON.parse(localStorage.getItem("helix-chats") || "[]");
let activeId = null;

function save() { localStorage.setItem("helix-chats", JSON.stringify(chats.slice(0, 20))); }
function makeChat() { const chat = { id: crypto.randomUUID(), title: "New research", createdAt: Date.now(), messages: [] }; chats.unshift(chat); activeId = chat.id; save(); render(); return chat; }
function active() { return chats.find(chat => chat.id === activeId) || makeChat(); }
function renderRecents() { recents.replaceChildren(); chats.slice(0, 9).forEach(chat => { const item = document.createElement("button"); item.className = `recent ${chat.id === activeId ? "active" : ""}`; const label = document.createElement("span"); label.textContent = chat.title; item.append(label); item.onclick = () => { activeId = chat.id; render(); }; recents.append(item); }); }
function renderMessage(message) { const card = document.createElement("article"); card.className = `message ${message.type || ""}`; const heading = document.createElement("div"); heading.className = "source"; heading.textContent = message.source; const body = document.createElement("div"); body.textContent = message.text; card.append(heading, body); conversation.append(card); }
function renderSources(sources) { if (!sources?.length) return; const card = document.createElement("article"); card.className = "sources"; const heading = document.createElement("div"); heading.className = "source"; heading.textContent = "SCIENTIFIC SOURCES"; card.append(heading); sources.forEach((item, index) => { const link = document.createElement("a"); link.href = item.doi || "#"; link.target = "_blank"; link.rel = "noreferrer"; const title = document.createElement("b"); title.textContent = `${index + 1}. ${item.title}`; const meta = document.createElement("span"); meta.textContent = `${item.venue || item.source} · ${item.year} · cited by ${Number(item.citedBy || 0).toLocaleString()}`; link.append(title, meta); card.append(link); }); conversation.append(card); }
function render() { const chat = active(); renderRecents(); conversation.replaceChildren(); if (!chat.messages.length) { empty.style.display = "block"; conversation.style.display = "none"; return; } empty.style.display = "none"; conversation.style.display = "flex"; chat.messages.forEach(message => { renderMessage(message); if (message.sources) renderSources(message.sources); }); }
function add(message) { const chat = active(); chat.messages.push(message); if (message.source === "YOU" && chat.title === "New research") chat.title = message.text.slice(0, 38); save(); render(); }
function setBusy(busy) { send.disabled = busy; send.innerHTML = busy ? "Searching…" : "Research <b>↗</b>"; }
async function localAnswer(question) { const response = await fetch("/api/local", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: question }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Helix could not process the question."); return data.text; }
async function scholarlySources(question) {
  const query = encodeURIComponent(question.slice(0, 300));
  const response = await fetch(`https://api.openalex.org/works?search=${query}&per-page=5`);
  if (!response.ok) throw new Error("OpenAlex is not responding.");
  const data = await response.json();
  const sources = (data.results || []).map(work => ({ title: String(work.title || "Untitled work").replace(/<[^>]+>/g, ""), year: work.publication_year || "n.d.", doi: work.doi || work.primary_location?.landing_page_url || "", venue: work.primary_location?.source?.display_name || "OpenAlex", citedBy: work.cited_by_count || 0, source: "OpenAlex" })).filter(work => work.doi || work.title !== "Untitled work");
  if (!sources.length) throw new Error("No matching records were found.");
  return sources;
}
async function research(question) { add({ source: "YOU", text: question, type: "user" }); setBusy(true); const [local, sources] = await Promise.allSettled([localAnswer(question), scholarlySources(question)]); if (local.status === "fulfilled") add({ source: "HELIX SCIENCE", text: local.value, sources: sources.status === "fulfilled" ? sources.value : [] }); else add({ source: "HELIX", text: "I couldn’t process that question locally. Please try again.", type: "error" }); if (sources.status === "rejected") add({ source: "SOURCE NOTICE", text: "Your answer is available, but live paper results could not be reached right now. Check your internet connection and try again.", type: "error" }); setBusy(false); }
function parseCredential(credential) { try { return JSON.parse(atob(credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))); } catch { return null; } }
function setupGoogle() { const clientId = window.PRISM_CONFIG?.googleClientId; const setup = el("#google-setup"); el("#close-setup").onclick = () => setup.close(); el("#signin").onclick = () => { if (!clientId) { setup.showModal(); return; } googleSlot.style.display = "block"; googleSlot.scrollIntoView({ behavior: "smooth" }); };
  if (!clientId) return;
  const script = document.createElement("script"); script.src = "https://accounts.google.com/gsi/client"; script.async = true; script.onload = () => { google.accounts.id.initialize({ client_id: clientId, callback: response => { const profile = parseCredential(response.credential); if (!profile?.email) return; localStorage.setItem("helix-profile", JSON.stringify({ name: profile.name || profile.email, email: profile.email, picture: profile.picture || "" })); accountLabel.textContent = profile.name || profile.email; googleSlot.style.display = "none"; } }); google.accounts.id.renderButton(googleSlot, { theme: "outline", size: "medium", shape: "pill", text: "continue_with", width: 220 }); }; document.head.append(script);
  const profile = JSON.parse(localStorage.getItem("helix-profile") || "null"); if (profile) accountLabel.textContent = profile.name || profile.email;
}
el("#new-chat").onclick = () => { makeChat(); prompt.focus(); };
document.querySelectorAll(".topic-grid button").forEach(button => button.onclick = () => research(button.textContent));
prompt.addEventListener("input", () => { prompt.style.height = "auto"; prompt.style.height = `${Math.min(prompt.scrollHeight, 180)}px`; });
form.onsubmit = event => { event.preventDefault(); const question = prompt.value.trim(); if (!question) return; prompt.value = ""; prompt.style.height = "auto"; research(question); };
fetch("/api/status").then(response => response.json()).then(data => { status.textContent = data.online ? "Live scholarly search enabled" : "Research sources unavailable"; el("#models").textContent = data.name; }).catch(() => { status.textContent = "Unable to reach Helix"; });
if (!chats.length) makeChat(); else { activeId = chats[0].id; render(); }
setupGoogle();
