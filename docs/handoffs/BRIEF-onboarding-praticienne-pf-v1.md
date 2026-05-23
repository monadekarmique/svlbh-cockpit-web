# Brief dev — Endpoint admin Onboarding praticienne + lib PostFinance Checkout · v1

**Pour** : l'autre instance Claude (patricktest.local) sur le repo `cockpit-web` (svlbh-cockpit-web, srv-d7vmf0faqgkc739dnqi0)
**De** : Patrick Bays + Claude (patrickbays.local)
**Date** : 21 mai 2026
**Priorité** : haute — prérequis pour onboarder Cornelia (1ère praticienne sandbox PF, credentials déjà collectés)

---

## Contexte

Cornelia a ouvert un compte PostFinance Checkout (avant son RDV KYC business du 25 mai), a créé un Space sandbox + Application User, et nous a transmis ses 3 credentials. Pour brancher son compte à notre infra **sans qu'elle ni Patrick ne fasse d'opérations manuelles supplémentaires**, on développe un endpoint admin dans cockpit-web qui automatise :

1. Le stockage chiffré de ses credentials dans Supabase
2. La création du Webhook Listener côté PostFinance Checkout via API (signature MAC HTTP, côté serveur)
3. La consignation dans `audit_log`

Une fois cet endpoint live, on l'utilise une fois pour Cornelia (sandbox), puis on le réutilise pour Anne (après son KYC du 27 mai) et toutes les futures praticiennes.

## Architecture existante à intégrer

Le scenario Make.com **#8998624 « SVLBH PostFinance Payment »** est **actif** et traite déjà les webhooks PF entrants :

```
PF webhook → Make hook.eu2.make.com/<hookKey> (hookId=4022088)
           → Anthropic Claude Haiku 4.5 parse payload
           → POST bridge patricktest (segment=payment)
           → POST svlbh-pro-1-backend.onrender.com/webhooks/peppershop/order
```

→ **L'URL du Webhook Listener à créer côté PF de la praticienne doit pointer vers `https://hook.eu2.make.com/<hookKey>`** (récupérable via MCP Make : `hooks_get` avec hookId=4022088 retourne `url`).

**Ne PAS développer de route webhook /api/webhooks/postfinance côté cockpit-web** — l'architecture existante via Make est suffisante. cockpit-web n'a qu'à créer le Listener PF, pas le recevoir.

## Ce qu'on veut

### 1. Migration Supabase

Étendre `praticienne_profile` :

```sql
ALTER TABLE praticienne_profile
  ADD COLUMN IF NOT EXISTS display_code               VARCHAR(6),
  ADD COLUMN IF NOT EXISTS pf_environment             VARCHAR(16),  -- 'sandbox' | 'production'
  ADD COLUMN IF NOT EXISTS pf_space_id                BIGINT,
  ADD COLUMN IF NOT EXISTS pf_app_user_id             BIGINT,
  ADD COLUMN IF NOT EXISTS pf_auth_key_encrypted      BYTEA,         -- pgp_sym_encrypt
  ADD COLUMN IF NOT EXISTS pf_webhook_id              BIGINT,
  ADD COLUMN IF NOT EXISTS pf_webhook_secret_encrypted BYTEA,
  ADD COLUMN IF NOT EXISTS pf_onboarded_at            TIMESTAMPTZ;

-- Index pour retrouver une praticienne via son Space ID (matching webhook)
CREATE INDEX IF NOT EXISTS idx_praticienne_pf_space_id
  ON praticienne_profile (pf_space_id)
  WHERE pf_space_id IS NOT NULL;

-- Index display_code
CREATE INDEX IF NOT EXISTS idx_praticienne_display_code
  ON praticienne_profile (display_code)
  WHERE display_code IS NOT NULL;
```

⚠️ **Chiffrement** : `pf_auth_key_encrypted` et `pf_webhook_secret_encrypted` doivent utiliser **pgcrypto** (`pgp_sym_encrypt(value, current_setting('app.praticienne_encryption_key'))`). La clé maître `app.praticienne_encryption_key` est définie dans Supabase via `ALTER DATABASE ... SET app.praticienne_encryption_key = '...'` ou via env var `PRATICIENNE_ENCRYPTION_KEY` injectée dans le RPC.

### 2. Lib PostFinance Checkout (`lib/postfinance-checkout/`)

Nouveau module TypeScript dans `cockpit-web/lib/postfinance-checkout/` :

**`mac-auth.ts`** — signature MAC HTTP PF (HMAC-SHA512) :

```typescript
import { createHmac } from 'crypto';

export function macAuthHeaders(opts: {
  userId: number;
  authKeyBase64: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;  // ex: '/api/webhook-listener/create'
}) {
  const version = '1';
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const message = `${version}|${opts.userId}|${timestamp}|${opts.method}|${opts.path}`;
  const keyBytes = Buffer.from(opts.authKeyBase64, 'base64');
  const macBytes = createHmac('sha512', keyBytes).update(message).digest();
  const macValue = macBytes.toString('base64');
  return {
    'x-mac-userid': opts.userId.toString(),
    'x-mac-version': version,
    'x-mac-timestamp': timestamp,
    'x-mac-value': macValue,
  };
}
```

**`api-client.ts`** — wrapper requests vers `https://checkout.postfinance.ch/api/*` :

```typescript
export async function pfApiCall(opts: {
  userId: number;
  authKeyBase64: string;
  method: 'POST' | 'GET' | 'PUT' | 'DELETE';
  path: string;          // ex: '/api/webhook-listener/create?spaceId=96870'
  body?: object;
}) {
  const headers = {
    ...macAuthHeaders(opts),
    'Content-Type': 'application/json;charset=utf-8',
    'Accept': 'application/json',
  };
  const res = await fetch(`https://checkout.postfinance.ch${opts.path}`, {
    method: opts.method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PF API ${res.status}: ${text}`);
  }
  return res.json();
}
```

**`webhook-listener.ts`** — fonctions métier :

```typescript
export async function createWebhookListener(opts: {
  userId: number;
  authKeyBase64: string;
  spaceId: number;
  name: string;
  url: string;
  entityStates: string[];  // ['FULFILL', 'AUTHORIZED', 'COMPLETED']
}) {
  return pfApiCall({
    userId: opts.userId,
    authKeyBase64: opts.authKeyBase64,
    method: 'POST',
    path: `/api/webhook-listener/create?spaceId=${opts.spaceId}`,
    body: {
      name: opts.name,
      state: 'ACTIVE',
      url: opts.url,
      entity: 1472041829003,   // ID de l'entité Transaction (doc PF officielle)
      entityStates: opts.entityStates,
      notifyEveryChange: false,
      enablePayloadSignatureAndState: true,
    },
  });
  // Retourne { id, name, state, url, version, webhookEncryptionPublicKey, ... }
  // Le webhook secret (pour vérifier HMAC payload) est dans webhookEncryptionPublicKey
  // OU à récupérer via un autre endpoint /api/webhook-encryption (à vérifier doc)
}

export async function deleteWebhookListener(opts: {...}) { ... }
export async function listWebhookListeners(opts: {...}) { ... }
```

⚠️ **À vérifier dans la doc officielle PF Checkout** (`https://checkout.postfinance.ch/doc/api/web-service`) :
- L'ID exact de l'entité Transaction (peut varier — 1472041829003 est ma meilleure estimation)
- Le mécanisme exact de récupération du webhook secret (champ retourné ou endpoint séparé)

### 3. Route admin Server Action

`app/admin/praticiennes/onboard/actions.ts` :

```typescript
'use server';

import { createServerActionClient } from '@/lib/supabase/server';
import { createWebhookListener } from '@/lib/postfinance-checkout/webhook-listener';
import { getMakeHookUrl } from '@/lib/make/hooks';  // helper qui retourne hook.eu2.make.com/<hookKey>

export async function onboardPraticienne(input: {
  display_code: string;       // ex: '003366'
  pf_environment: 'sandbox' | 'production';
  pf_space_id: number;
  pf_app_user_id: number;
  pf_auth_key: string;        // base64, transmis depuis le formulaire
}) {
  const supabase = createServerActionClient();

  // 1. Vérifier Owner ST6
  const { data: ownerCheck } = await supabase.rpc('is_owner_st6');
  if (!ownerCheck) throw new Error('Unauthorized');

  // 2. INSERT praticienne_profile (credentials chiffrés)
  const { data: row, error: insertErr } = await supabase
    .from('praticienne_profile')
    .insert({
      display_code: input.display_code,
      pf_environment: input.pf_environment,
      pf_space_id: input.pf_space_id,
      pf_app_user_id: input.pf_app_user_id,
    })
    .select('id')
    .single();
  if (insertErr) throw insertErr;

  // 2.5 Chiffrer pf_auth_key via RPC SECURITY DEFINER
  await supabase.rpc('encrypt_praticienne_auth_key', {
    praticienne_id: row.id,
    plaintext_key: input.pf_auth_key,
  });

  // 3. Créer Webhook Listener côté PF
  const makeUrl = await getMakeHookUrl(4022088);  // ex: 'https://hook.eu2.make.com/lllo...s'
  const listener = await createWebhookListener({
    userId: input.pf_app_user_id,
    authKeyBase64: input.pf_auth_key,
    spaceId: input.pf_space_id,
    name: `SVLBH-${input.display_code}-${input.pf_environment}`,
    url: makeUrl,
    entityStates: ['FULFILL', 'AUTHORIZED', 'COMPLETED'],
  });

  // 4. Stocker pf_webhook_id + pf_webhook_secret_encrypted
  await supabase
    .from('praticienne_profile')
    .update({
      pf_webhook_id: listener.id,
      pf_onboarded_at: new Date().toISOString(),
    })
    .eq('id', row.id);

  if (listener.webhookEncryptionPublicKey) {
    await supabase.rpc('encrypt_praticienne_webhook_secret', {
      praticienne_id: row.id,
      plaintext_secret: listener.webhookEncryptionPublicKey,
    });
  }

  // 5. Audit log
  await supabase.rpc('log_audit_event', {
    p_action: 'ONBOARD',
    p_target_table: 'praticienne_profile',
    p_target_row_id: row.id,
    p_payload: {
      display_code: input.display_code,
      pf_environment: input.pf_environment,
      pf_space_id: input.pf_space_id,
      pf_webhook_id: listener.id,
    },
    p_via: 'cockpit-admin-onboard',
  });

  return { uuid: row.id, pf_webhook_id: listener.id, status: 'ok' };
}
```

### 4. UI admin minimale

`app/admin/praticiennes/onboard/page.tsx` :

- Form avec 4 champs : `display_code` (texte 6 chars hex), `pf_environment` (select sandbox/production), `pf_space_id` (number), `pf_app_user_id` (number), `pf_auth_key` (password input pour masquer à la frappe)
- Bouton « Onboarder »
- Au submit → server action `onboardPraticienne`
- Toast succès « ✅ Praticienne {display_code} onboardée, webhook {pf_webhook_id} créé »
- Toast erreur si échec API PF

UI courte et fonctionnelle, pas besoin de fioritures — c'est admin only, peu utilisée.

### 5. RPC Supabase pour chiffrement

```sql
CREATE OR REPLACE FUNCTION encrypt_praticienne_auth_key(
  praticienne_id UUID,
  plaintext_key TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_owner_st6() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE praticienne_profile
  SET pf_auth_key_encrypted = pgp_sym_encrypt(
    plaintext_key,
    current_setting('app.praticienne_encryption_key')
  )
  WHERE id = praticienne_id;
END;
$$;

-- Idem pour encrypt_praticienne_webhook_secret
```

⚠️ **La clé maître `app.praticienne_encryption_key`** doit être définie en amont :
```sql
ALTER DATABASE postgres SET app.praticienne_encryption_key = '<long_random_string>';
-- Le secret doit être stocké également dans Render env var pour pouvoir le rotater
```

## Critères d'acceptation

- [ ] Migration `praticienne_profile` appliquée avec les 7 nouvelles colonnes + 2 index + RLS Owner ST6 conservée
- [ ] Lib `lib/postfinance-checkout/` créée avec 3 fichiers (mac-auth, api-client, webhook-listener) + tests unitaires sur la signature MAC (vecteur de test fourni par doc PF)
- [ ] Route `/admin/praticiennes/onboard` (UI + server action) déployée et accessible Owner ST6 only
- [ ] Audit log capture l'event `ONBOARD` avec payload complet (display_code, environment, space_id, webhook_id)
- [ ] Test E2E : onboarder Cornelia (display_code=003366, sandbox, space_id=96870, app_user_id=170682, auth_key=`gfOrmnHiADgJUb1lA5VHS3RVIgrN4vHM100BXa07tCg=`) → vérification :
  - `praticienne_profile` row créé avec credentials chiffrés
  - Webhook Listener créé côté PF (vérifier via API list)
  - Webhook pointing vers l'URL Make.com récupérée du hookId=4022088
  - audit_log event présent
- [ ] Bearer reader patrickbays.local peut lire `?table=praticienne_profile` via RPC bearer-aware (mais credentials chiffrés ne sont JAMAIS retournés en clair, juste les valeurs non-sensibles)

## Test E2E sandbox post-onboarding

Après onboarding Cornelia, déclencher une transaction sandbox via API PF (carte de test `4242 4242 4242 4242`) → vérifier que :
1. Le webhook arrive bien sur l'URL Make.com
2. Le scenario #8998624 le parse correctement
3. Le POST final vers svlbh-pro-1-backend/webhooks/peppershop/order arrive bien
4. L'event est consigné dans audit_log

## Sécurité — points clés

- **Auth Key jamais en clair côté client** — transmise depuis le form en HTTPS → POST server action → chiffrement IMMÉDIAT côté serveur, jamais loggée
- **pf_auth_key_encrypted lu seulement par RPC SECURITY DEFINER** — jamais via SELECT direct côté client
- **Audit log ne stocke jamais la Key elle-même** — uniquement les IDs (space_id, app_user_id, webhook_id) et display_code
- **Révocation** : si une praticienne veut retirer son consentement, RPC `revoke_praticienne_pf` qui DELETE le Webhook Listener côté PF + NULL les colonnes pf_* en DB + audit log
- **Rotation de la clé maître `app.praticienne_encryption_key`** : prévoir une procédure de rotation (decrypt avec ancienne clé → encrypt avec nouvelle)

## Journal de version

| Version | Date | Évolution |
|---|---|---|
| v1 | 21 mai 2026 | Brief initial — endpoint admin `/admin/praticiennes/onboard` côté cockpit-web (option A choisie par Patrick). Stack : Migration Supabase + lib PF Checkout (signature MAC HTTP + create webhook listener) + UI form + server action + RPC chiffrement pgcrypto. Réutilise scenario Make #8998624 existant comme middleware webhook PF→backend. Critères d'acceptation : test E2E avec Cornelia (sandbox, display_code=003366). |

*Document SVLBH · 21 mai 2026 · v1 — brief dev cockpit-admin-onboarding-praticienne pour l'autre instance Claude*
