/*
 * Doctrine cockpit — fil d'Ariane pour articles HTML statiques.
 *
 * Inclus via : <script src="/article-chrome.js" defer></script> dans <head>.
 *
 * Structure : SVLBH Cockpit › <Module> › <Article> (chaque segment cliquable
 * sauf le dernier) + build version + commit à droite.
 *
 * Charte graphique : reprend celle de la topnav de la Palette de Lumière
 * (DEC Patrick 2026-06-03 v4 « structure du fil d'Ariane + charte topnav »).
 *   - Sticky top, fond crème translucide #F5EDE4 / blur 10px / sat 180%
 *   - Border-bottom plum à 15%
 *   - DM Sans pour le reste, Crimson Pro pour le root (segment SVLBH Cockpit)
 *   - Liens couleur plum #8B3A62 bold 600
 *
 * Source des labels : /api/cockpit-meta (qui expose COCKPIT_NAV).
 * Équivalent React : src/components/page-breadcrumb.tsx.
 */
(async function () {
  "use strict";

  // Palette de Lumière — design tokens topnav (référence).
  const TOK = {
    cream: "rgba(245,237,228,.94)",
    bordeaux: "#7A0F26",
    bordeauxBorder: "rgba(122,15,38,.15)",
    bordeauxHover: "rgba(122,15,38,.75)",
    ink: "#26183a",
    inkSoft: "#5b4a6b",
    sans: "'DM Sans',system-ui,-apple-system,BlinkMacSystemFont,sans-serif",
    serif: "'Crimson Pro',Georgia,serif",
  };

  function humanize(slug) {
    let s = slug.replace(/\.html?$/i, "");
    s = s.replace(/-v\d+(\.\d+)*$/i, "");
    s = s.replace(/[-_]/g, " ");
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function buildItems(meta) {
    const path = window.location.pathname;
    const segments = path.split("/").filter(Boolean);
    const items = [];
    if (segments.length === 0 || segments[0] === "dashboard") {
      items.push({
        href: "/",
        label: "Cockpit",
        isCurrent: true,
        isRoot: true,
      });
      return items;
    }
    items.push({
      href: "/",
      label: "Cockpit",
      isCurrent: false,
      isRoot: true,
    });
    let accumulated = "";
    segments.forEach(function (seg, i) {
      accumulated += "/" + seg;
      const navMatch = meta.nav.find(function (n) {
        return n.href === accumulated;
      });
      const label = navMatch ? navMatch.label : humanize(seg);
      items.push({
        href: accumulated,
        label: label,
        isCurrent: i === segments.length - 1,
        isRoot: false,
      });
    });
    return items;
  }

  function render(meta) {
    if (document.getElementById("cockpit-chrome")) return;

    const items = buildItems(meta);

    const bar = document.createElement("div");
    bar.id = "cockpit-chrome";
    bar.style.cssText = [
      "position:sticky",
      "top:0",
      "z-index:50",
      "background:" + TOK.cream,
      "-webkit-backdrop-filter:saturate(180%) blur(10px)",
      "backdrop-filter:saturate(180%) blur(10px)",
      "border-bottom:1px solid " + TOK.bordeauxBorder,
      "padding:10px max(20px,env(safe-area-inset-right)) 10px max(20px,env(safe-area-inset-left))",
      "display:flex",
      "align-items:center",
      "justify-content:space-between",
      "gap:16px",
      "font-family:" + TOK.sans,
      "font-size:.88rem",
    ].join(";");

    const nav = document.createElement("nav");
    nav.setAttribute("aria-label", "Audit trail");
    nav.style.cssText =
      "display:flex;align-items:center;gap:.55em;overflow-x:auto;flex:1;min-width:0;";

    items.forEach(function (it, i) {
      if (i > 0) {
        const sep = document.createElement("span");
        sep.textContent = "›";
        sep.style.cssText =
          "color:" + TOK.bordeauxBorder + ";flex-shrink:0;font-size:1.1em;";
        sep.setAttribute("aria-hidden", "true");
        nav.appendChild(sep);
      }
      const isRoot = it.isRoot;
      const sharedRoot = isRoot
        ? "font-family:" +
          TOK.serif +
          ";font-weight:700;font-size:1.05rem;letter-spacing:.01em;"
        : "font-weight:600;";
      if (it.isCurrent) {
        const cur = document.createElement("span");
        cur.textContent = it.label;
        cur.style.cssText =
          sharedRoot + "color:" + TOK.bordeaux + ";flex-shrink:0;";
        cur.setAttribute("aria-current", "page");
        nav.appendChild(cur);
      } else {
        const a = document.createElement("a");
        a.href = it.href;
        a.textContent = it.label;
        a.style.cssText =
          sharedRoot +
          "color:" +
          TOK.bordeaux +
          ";text-decoration:none;flex-shrink:0;white-space:nowrap;transition:opacity .12s;";
        a.addEventListener("mouseenter", function () {
          a.style.opacity = ".75";
        });
        a.addEventListener("mouseleave", function () {
          a.style.opacity = "";
        });
        nav.appendChild(a);
      }
    });

    const build = document.createElement("span");
    build.textContent = "build " + meta.version + " · " + meta.commit;
    build.style.cssText =
      "font-family:ui-monospace,Menlo,Monaco,'SF Mono',monospace;font-size:.68rem;color:" +
      TOK.inkSoft +
      ";flex-shrink:0;white-space:nowrap;opacity:.7;";
    build.title = "build " + meta.version + " · commit " + meta.commit;

    bar.appendChild(nav);
    bar.appendChild(build);

    if (document.body.firstChild) {
      document.body.insertBefore(bar, document.body.firstChild);
    } else {
      document.body.appendChild(bar);
    }
  }

  try {
    const res = await fetch("/api/cockpit-meta", { cache: "default" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const meta = await res.json();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        render(meta);
      });
    } else {
      render(meta);
    }
  } catch (e) {
    console.warn("[cockpit-chrome] failed to load:", e);
  }
})();
