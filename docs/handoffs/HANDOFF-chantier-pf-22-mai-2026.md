# Handoff — Chantier PostFinance Checkout · 22 mai 2026 (matin)

Salut. Ce handoff couvre le chantier d'onboarding des praticiennes sur PostFinance Checkout. On bosse là-dessus depuis hier soir, c'est presque débloqué — il reste un fix à appliquer et un retest.

## Où on en est

On veut que chaque praticienne SVLBH connecte son compte PostFinance Checkout à notre infra pour recevoir des paiements TWINT/carte/QR-bill. On a développé un endpoint admin `/admin/praticiennes/onboard` dans **svlbh-cockpit-web** (Owner ST6 only) qui prend les credentials PF d'une praticienne, les chiffre dans Supabase, et crée un Webhook Listener côté PF via API.

Deux praticiennes servent de cas test :
- **Cornelia Althaus** (ST4 #00300) — compte PF avec Space sandbox #96870
- **Anne Grangier Bays** (ST5 #00302) — compte PF avec Space sandbox #96881

Le code est déployé (derniers sha : 64d7560 → 23ff0ef → fd614c8). La signature MAC HTTP fonctionne (validée hier soir avec une clé fraîche). L'INSERT praticienne + chiffrement marchent. Mais **la création du Webhook Listener échoue en HTTP 442**.

## Le blocage et sa cause

L'erreur PF : « Unable to convert the value 'https://cockpit.svlbh.com/api/webhooks/postfinance/<token>' to the target property 'url'. »

On a trouvé la cause dans la doc PF (`/doc/webhooks`) : PostFinance utilise une **architecture webhook en 2 niveaux**. Un *Webhook Listener* ne prend pas une URL string dans son champ `url` — il prend l'**ID entier d'un objet *Webhook URL*** qu'il faut créer d'abord. Le code envoie une string, PF n'arrive pas à la convertir en ID → 442.

**Le fix** (détaillé dans `brief-fix-442-webhook-pf_v1.md`) : faire en 2 temps —
1. `POST /api/webhook-url/create` avec `{name, url, state}` → récupère un `id`
2. `POST /api/webhook-listener/create` avec `url: <cet_id_entier>` (pas la string)

C'est le boulot principal qui reste. Une fois fait : cleanup des rows Cornelia/Anne (`pf_webhook_id`, `pf_onboarded_at`, etc. → NULL), puis Patrick retente Cornelia via l'UI.

## Ce qu'on a appris de la doc PF (à ne pas re-chercher)

- **Entity Transaction ID** = `1472041829003` (confirmé par un payload exemple de la doc)
- **Signature des webhooks entrants** = **ECDSA SHA-256** (header `x-signature: algorithm=SHA256withECDSA, keyId=..., signature=...`), PAS du HMAC. Le receiver doit récupérer la clé publique via le Webhook Encryption Service (endpoint read avec le keyId) et vérifier en ECDSA. Si le code du receiver attend du HMAC, c'est à corriger.
- **9 IPs publiques PF** à whitelister dans Cloudflare (sinon Bot Fight Mode bloque les webhooks entrants) :
  `52.211.247.160, 52.211.171.77, 52.211.239.229, 52.211.209.173, 52.208.210.84, 52.212.109.85, 52.210.89.1, 52.212.185.152, 52.212.192.130`
  → WAF Custom Rule "Skip" sur `/api/webhooks/postfinance/*` pour ces IPs.
- **Prérequis possible non confirmé** : le compte PF de Cornelia affichait « configurer au moins un connecteur de paiement ». Si le fix 2-step échoue encore, créer un connecteur de test dans le Space sandbox avant de réessayer.

## Les credentials (les Auth Keys sont à récupérer ailleurs, pas dans ce fichier)

- **Cornelia** : Space `96870`, App User `170682`. Auth Key régénérée hier (valide) — Patrick l'a.
- **Anne** : Space `96881`, App User `170702`. Auth Key avec une ambiguïté typo (I majuscule vs l minuscule) — si HTTP 401 sur Anne, régénérer via PF « Manage Authentication Key ».

⚠️ Ne jamais committer les Auth Keys. Elles transitent par le form admin → chiffrées immédiatement côté serveur (pgcrypto/Vault).

## L'architecture autour (pour contexte)

- Le scenario **Make.com #8998624** (hookId 4022088, hook.eu2.make.com) traite déjà les webhooks PF : il parse via Claude Haiku puis POST vers `svlbh-pro-1-backend.onrender.com/webhooks/peppershop/order`. On peut router les webhooks soit vers cockpit-web directement, soit via ce Make existant.
- Services Render : cockpit-web `srv-d7vmf0faqgkc739dnqi0`, pro-web `srv-d7uqtt3bc2fs73evpip0`, priv-web `srv-d7v9mk3tqb8s73f4tsvg`, svlbh-com `srv-d7snr050lvsc73ct3dfg`. ownerId `tea-cv5pkjun91qc73e6kt8g`.

## Ce qui vient après (pas urgent)

**Pivot OAuth Web App.** L'approche actuelle (Application User créé à la main par chaque praticienne + copier-coller de credentials via session vocale) ne scale pas. La doc PF (`/doc/web-app-with-oauth`) décrit le vrai pattern multi-tenant : SVLBH enregistre une Web App une fois (client_id/secret), chaque praticienne « installe » en 1 clic via `oauth/v2/authorize`, callback `POST /api/v2.0/web-apps/confirm/{code}` → access_token web-service-hmac. Zéro copier-coller, installation auto. À faire une fois le fix tactique validé et qu'on a confirmé que toute la chaîne marche bout-en-bout.

## Validation depuis patrickbays.local

Le bearer reader `rdr_pt_a3b6d26d19a09262a008c8993749054d4bfbc7bae51e2d11` peut lire l'audit_log. Après un onboarding réussi, on doit voir `ONBOARD_PF` + `UPDATE praticienne_profile` (trigger V2) :
```
curl -H "Authorization: Bearer $TOK" \
  "https://cockpit.svlbh.com/compliance/audit-log?table=praticienne_profile"
```

## Tâche immédiate

1. Appliquer le fix 2-step (webhook-url → webhook-listener) dans la lib PostFinance de cockpit-web
2. Cleanup SQL des rows Cornelia/Anne
3. Whitelister les 9 IPs PF dans Cloudflare
4. Déployer, dire « fix live » à Patrick
5. Retest Cornelia → valider via audit_log

Bon courage. — Claude (patrickbays.local)
