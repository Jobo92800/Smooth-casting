// Relais entre l'appli et Airtable : le jeton Airtable reste côté serveur (variables d'environnement Netlify).
// Variables à définir dans Netlify : AIRTABLE_TOKEN, AIRTABLE_BASE_ID, et optionnellement APP_PASSWORD.
const TABLES = {
  cands: process.env.AIRTABLE_TABLE || "tbl2MINZfeGKZSQKl",      // « Candidats »
  evals: process.env.AIRTABLE_EVAL_TABLE || "tbljLehgS2HKtZJuf", // « Évaluations » (une ligne par juré et par candidat)
};

export default async (req) => {
  const { AIRTABLE_TOKEN, AIRTABLE_BASE_ID, APP_PASSWORD } = process.env;
  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) return json({ error: "Variables AIRTABLE_TOKEN / AIRTABLE_BASE_ID manquantes" }, 500);
  if (APP_PASSWORD && req.headers.get("x-casting-key") !== APP_PASSWORD) return json({ error: "Mot de passe requis" }, 401);

  const url = (t) => `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLES[t]}`;
  const at = (u, init = {}) => fetch(u, {
    ...init,
    headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, "Content-Type": "application/json" },
  });
  const listAll = async (t) => {
    const out = [];
    let offset = "";
    do {
      const r = await at(`${url(t)}?pageSize=100${offset ? `&offset=${offset}` : ""}`);
      if (!r.ok) throw new Error(`${t}: ${r.status} ${await r.text()}`);
      const data = await r.json();
      out.push(...data.records);
      offset = data.offset || "";
    } while (offset);
    return out;
  };

  try {
    if (req.method === "GET") {
      const [records, evals] = await Promise.all([listAll("cands"), listAll("evals")]);
      return json({ records, evals });
    }

    const body = await req.json();
    const t = body.table === "evals" ? "evals" : "cands";

    if (req.method === "PATCH") {
      if (!/^rec[A-Za-z0-9]{14}$/.test(body.id || "")) return json({ error: "id invalide" }, 400);
      const r = await at(`${url(t)}/${body.id}`, { method: "PATCH", body: JSON.stringify({ fields: body.fields, typecast: true }) });
      return passThrough(r);
    }

    if (req.method === "POST") {
      const r = await at(url(t), { method: "POST", body: JSON.stringify({ fields: body.fields, typecast: true }) });
      return passThrough(r);
    }

    return json({ error: "Méthode non autorisée" }, 405);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
};

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const passThrough = async (r) => new Response(await r.text(), { status: r.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
