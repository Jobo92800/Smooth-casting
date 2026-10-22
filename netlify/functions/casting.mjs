// Relais entre l'appli et Airtable : le jeton Airtable reste côté serveur (variables d'environnement Netlify).
// Variables à définir dans Netlify : AIRTABLE_TOKEN, AIRTABLE_BASE_ID, et optionnellement APP_PASSWORD.
const TABLE = process.env.AIRTABLE_TABLE || "tbl2MINZfeGKZSQKl"; // table « Candidats » de la base Smooth - Casting

export default async (req) => {
  const { AIRTABLE_TOKEN, AIRTABLE_BASE_ID, APP_PASSWORD } = process.env;
  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) return json({ error: "Variables AIRTABLE_TOKEN / AIRTABLE_BASE_ID manquantes" }, 500);
  if (APP_PASSWORD && req.headers.get("x-casting-key") !== APP_PASSWORD) return json({ error: "Mot de passe requis" }, 401);

  const base = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLE}`;
  const at = (url, init = {}) => fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, "Content-Type": "application/json" },
  });

  try {
    if (req.method === "GET") {
      const records = [];
      let offset = "";
      do {
        const r = await at(`${base}?pageSize=100${offset ? `&offset=${offset}` : ""}`);
        if (!r.ok) return passThrough(r);
        const data = await r.json();
        records.push(...data.records);
        offset = data.offset || "";
      } while (offset);
      return json({ records });
    }

    const body = await req.json();

    if (req.method === "PATCH") {
      if (!/^rec[A-Za-z0-9]{14}$/.test(body.id || "")) return json({ error: "id invalide" }, 400);
      const r = await at(`${base}/${body.id}`, { method: "PATCH", body: JSON.stringify({ fields: body.fields, typecast: true }) });
      return passThrough(r);
    }

    if (req.method === "POST") {
      const r = await at(base, { method: "POST", body: JSON.stringify({ fields: body.fields, typecast: true }) });
      return passThrough(r);
    }

    return json({ error: "Méthode non autorisée" }, 405);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
};

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const passThrough = async (r) => new Response(await r.text(), { status: r.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
