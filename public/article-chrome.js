/*
 * Doctrine cockpit — chrome unifié pour articles HTML statiques.
 *
 * Inclus dans tout article HTML servi depuis public/*.html via :
 *   <script src="/article-chrome.js" defer></script>
 *
 * Injecte en haut du <body> une bande sticky avec :
 *   - GAUCHE : audit trail (breadcrumb) actionnable depuis window.location.pathname
 *   - DROITE : build version + commit court
 *
 * Équivalent vanilla du composant React src/components/page-breadcrumb.tsx.
 * Source des labels : /api/cockpit-meta (qui expose COCKPIT_NAV).
 *
 * DEC Patrick 2026-06-03.
 */
(async function () {
  "use strict";

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
        href: "/dashboard",
        label: "Dashboard",
        isCurrent: true,
      });
      return items;
    }
    items.push({
      href: "/dashboard",
      label: "Dashboard",
      isCurrent: false,
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
      "z-index:9999",
      "background:rgba(255,255,255,.92)",
      "-webkit-backdrop-filter:blur(8px)",
      "backdrop-filter:blur(8px)",
      "border-bottom:1px solid rgba(229,229,229,.7)",
      "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
      "font-size:12px",
      "padding:8px max(1rem,env(safe-area-inset-right)) 8px max(1rem,env(safe-area-inset-left))",
      "display:flex",
      "align-items:center",
      "justify-content:space-between",
      "gap:12px",
    ].join(";");

    const nav = document.createElement("nav");
    nav.setAttribute("aria-label", "Audit trail");
    nav.style.cssText =
      "display:flex;align-items:center;gap:6px;color:#737373;overflow-x:auto;flex:1;min-width:0;";

    items.forEach(function (it, i) {
      if (i > 0) {
        const sep = document.createElement("span");
        sep.textContent = "›";
        sep.style.cssText = "color:#d4d4d4;flex-shrink:0;";
        nav.appendChild(sep);
      }
      if (it.isCurrent) {
        const cur = document.createElement("span");
        cur.textContent = it.label;
        cur.style.cssText =
          "font-weight:600;color:#262626;flex-shrink:0;";
        cur.setAttribute("aria-current", "page");
        nav.appendChild(cur);
      } else {
        const a = document.createElement("a");
        a.href = it.href;
        a.textContent = it.label;
        a.style.cssText =
          "color:#737373;text-decoration:none;flex-shrink:0;padding:2px 6px;margin:0 -2px;border-radius:4px;transition:background .12s,color .12s;";
        a.addEventListener("mouseenter", function () {
          a.style.background = "#f5f5f5";
          a.style.color = "#171717";
        });
        a.addEventListener("mouseleave", function () {
          a.style.background = "";
          a.style.color = "#737373";
        });
        nav.appendChild(a);
      }
    });

    const build = document.createElement("span");
    build.textContent =
      "build " + meta.version + " · " + meta.commit;
    build.style.cssText =
      "font-family:ui-monospace,Menlo,Monaco,'SF Mono',monospace;font-size:10px;color:#a3a3a3;flex-shrink:0;white-space:nowrap;";
    build.title =
      "build " + meta.version + " · commit " + meta.commit;

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
