// Presentation-only enhancement layer injected into flowchart-style experiment
// bundles (the pipeline walkthrough / recovery-battery explainer). It never
// touches the bundle's data or logic — it only restyles and animates the
// existing DOM, and adds keyboard stepping on top of the page's own
// selectNode()/togglePlay() functions.
// Cool hub palette, streamed before the bundle so it paints in hub colors
// from the first frame. Overrides the bundle's own warm tokens.
export const EXPERIMENT_PALETTE_CSS = `
<style id="hub-palette">
  :root {
    --bg: #f4f7fb !important; --surface: #ffffff !important; --border: #dbe3ee !important;
    --text: #131a2b !important; --text-muted: #5f6b83 !important;
    --accent: #4f46e5 !important; --accent-soft: #e6e8fd !important; --chip-bg: #eaeff8 !important;
  }
  html.hub-dark {
    --bg: #0d1220 !important; --surface: #151c2e !important; --border: #27314a !important;
    --text: #eef2fb !important; --text-muted: #9aa6bf !important;
    --accent: #8b95ff !important; --accent-soft: #1e2542 !important; --chip-bg: #1a2135 !important;
  }
  html.hub-dark body { background: var(--bg) !important; color: var(--text) !important; }
</style>
`;

export const EXPERIMENT_ENHANCE_SCRIPT = `
<style id="hub-flow-enhance">
  .explainer { animation: hubFadeUp 0.5s ease both; }
  .node-icon, .detail-icon {
    font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
  }

  /* Hero */
  .explainer-hero h1 {
    font-size: 2.1rem;
    letter-spacing: -0.02em;
    background: linear-gradient(100deg, var(--text) 30%, var(--accent));
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  /* Play button + progress */
  .play-btn {
    position: relative;
    overflow: hidden;
    transition: transform 0.15s ease, box-shadow 0.2s ease;
  }
  .play-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(79,70,229,0.45); }
  .play-btn:active { transform: translateY(0); }
  .play-btn::after {
    content: ""; position: absolute; inset: 0;
    background: linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.45) 50%, transparent 65%);
    transform: translateX(-120%);
    animation: hubShine 3.2s ease-in-out infinite;
  }
  .progress-track { max-width: 420px; box-shadow: inset 0 0 0 1px var(--border); }
  .progress-fill {
    background: linear-gradient(90deg, var(--accent), #22d3ee);
    box-shadow: 0 0 12px rgba(79,70,229,0.6);
  }

  /* Lanes */
  .flow-grid { gap: 1.5rem; }
  .lane {
    border-radius: 18px;
    animation: hubFadeUp 0.55s ease both;
    transition: box-shadow 0.25s ease, border-color 0.25s ease, transform 0.25s ease;
    overflow: visible;
  }
  .lane:nth-child(1) { animation-delay: 0.02s; }
  .lane:nth-child(2) { animation-delay: 0.10s; }
  .lane:nth-child(3) { animation-delay: 0.18s; }
  .lane:nth-child(4) { animation-delay: 0.26s; }
  .lane::before {
    content: ""; position: absolute; inset-inline: 0; top: 0; height: 3px;
    border-radius: 18px 18px 0 0;
    background: linear-gradient(90deg, transparent, var(--accent), transparent);
    opacity: 0.5;
  }
  .lane.hub-lane-live {
    border-color: var(--accent);
    box-shadow: 0 10px 34px -14px rgba(79,70,229,0.55);
  }
  .lane.hub-lane-live::before { opacity: 1; animation: hubSlide 2.2s linear infinite; }

  /* Flowing connector arrows */
  .lane:not(:last-child)::after {
    opacity: 1;
    animation: hubFlow 1.8s ease-in-out infinite;
  }
  @media (max-width: 980px) {
    .lane:not(:last-child)::after { animation: hubFlowDown 1.8s ease-in-out infinite; }
  }

  /* Node cards */
  .node-card {
    position: relative;
    border-radius: 12px;
    padding: 0.65rem 0.8rem;
    transition: transform 0.18s cubic-bezier(.2,.8,.3,1), box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease;
  }
  .node-card:hover { transform: translateY(-3px) scale(1.015); box-shadow: 0 10px 24px -12px rgba(0,0,0,0.35); }
  .node-card .node-icon { transition: transform 0.18s ease; display: inline-block; }
  .node-card:hover .node-icon { transform: scale(1.18) rotate(-6deg); }
  .node-card.active {
    box-shadow: 0 0 0 2px var(--accent), 0 12px 30px -14px rgba(79,70,229,0.8);
    animation: hubPop 0.35s cubic-bezier(.2,.9,.3,1.4);
  }
  .node-card.active::before {
    content: ""; position: absolute; left: -1px; top: 12%; bottom: 12%; width: 3px;
    border-radius: 3px; background: var(--accent);
    animation: hubGlow 1.6s ease-in-out infinite;
  }
  .node-card.active .node-icon { transform: scale(1.15); }

  /* Detail panel */
  .detail-panel {
    border-radius: 18px;
    box-shadow: 0 16px 40px -28px rgba(0,0,0,0.55);
  }
  .detail-panel.hub-swap { animation: hubFadeUp 0.35s ease both; }
  .detail-header h2 { font-size: 1.35rem; letter-spacing: -0.01em; }
  .detail-icon { animation: hubFloat 3.4s ease-in-out infinite; }
  .detail-body p { line-height: 1.65; }
  .no-image { line-height: 1.5; }
  .axis-chip { transition: transform 0.18s ease; }
  .axis-chip:hover { transform: translateY(-2px); }

  .hub-hint {
    display: inline-flex; align-items: center; gap: 0.45rem;
    font-size: 0.72rem; color: var(--text-muted);
    border: 1px dashed var(--border); border-radius: 999px;
    padding: 0.25rem 0.7rem; margin-left: 0.2rem;
  }
  .hub-hint kbd {
    font: inherit; background: var(--chip-bg); border: 1px solid var(--border);
    border-radius: 5px; padding: 0 0.3rem;
  }

  @keyframes hubFadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
  @keyframes hubPop { 0% { transform: scale(0.97); } 60% { transform: scale(1.03); } 100% { transform: scale(1); } }
  @keyframes hubFlow { 0%,100% { transform: translateY(-50%) translateX(-3px); opacity: 0.45; } 50% { transform: translateY(-50%) translateX(3px); opacity: 1; } }
  @keyframes hubFlowDown { 0%,100% { transform: translateX(-50%) translateY(-3px); opacity: 0.45; } 50% { transform: translateX(-50%) translateY(3px); opacity: 1; } }
  @keyframes hubGlow { 0%,100% { opacity: 0.45; } 50% { opacity: 1; } }
  @keyframes hubFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
  @keyframes hubShine { 0%, 70% { transform: translateX(-120%); } 100% { transform: translateX(120%); } }
  @keyframes hubSlide { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

  @media (prefers-reduced-motion: reduce) {
    .explainer, .lane, .detail-panel.hub-swap, .detail-icon, .play-btn::after,
    .lane:not(:last-child)::after, .node-card.active, .node-card.active::before {
      animation: none !important;
    }
  }
</style>
<script>
(function () {
  // Emoji in the bundles' headings render as tofu/notdef boxes in most
  // browsers here, so strip them from headings and nav-ish labels.
  var EMOJI = /(?:[\\u2600-\\u27BF\\u2B00-\\u2BFF\\uFE0F\\u200D]|\\uD83C[\\uDC00-\\uDFFF]|\\uD83D[\\uDC00-\\uDFFF]|\\uD83E[\\uDD00-\\uDFFF])+/g;
  function deEmoji() {
    var sel = "h1, h2, h3, h4, .title, .subtitle, .lane-title, .node-title, .tab, button";
    document.querySelectorAll(sel).forEach(function (el) {
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
      var texts = [];
      while (walker.nextNode()) texts.push(walker.currentNode);
      texts.forEach(function (n) {
        EMOJI.lastIndex = 0;
        if (!EMOJI.test(n.nodeValue || "")) return;
        EMOJI.lastIndex = 0;
        n.nodeValue = (n.nodeValue || "").replace(EMOJI, "");
      });
      el.innerHTML = el.innerHTML;
      Array.prototype.forEach.call(el.querySelectorAll("*"), function (c) {
        if (!c.children.length && !(c.textContent || "").trim() && !c.querySelector("img,svg")) {
          c.parentNode.removeChild(c);
        }
      });
      if (el.firstChild && el.firstChild.nodeType === 3) {
        el.firstChild.nodeValue = (el.firstChild.nodeValue || "").replace(/^[\\s\\u00a0]+/, "");
      }
      if (el.lastChild && el.lastChild.nodeType === 3) {
        el.lastChild.nodeValue = (el.lastChild.nodeValue || "").replace(/[\\s\\u00a0]+$/, "");
      }
    });
    EMOJI.lastIndex = 0;
    if (EMOJI.test(document.title || "")) {
      EMOJI.lastIndex = 0;
      document.title = document.title.replace(EMOJI, "").trim();
    }
  }
  deEmoji();
  if (window.MutationObserver) {
    var t;
    new MutationObserver(function () {
      clearTimeout(t);
      t = setTimeout(deEmoji, 80);
    }).observe(document.body, { childList: true, subtree: true });
  }
})();
</script>
<script>
(function () {
  if (!document.querySelector(".flow-grid")) return;


  var cards = function () {
    return Array.prototype.slice.call(document.querySelectorAll(".node-card"));
  };

  function markLane() {
    document.querySelectorAll(".lane").forEach(function (lane) {
      lane.classList.toggle("hub-lane-live", !!lane.querySelector(".node-card.active"));
    });
  }

  // Re-play the detail panel entrance whenever the page swaps its contents.
  var panel = document.querySelector(".detail-panel");
  if (panel && window.MutationObserver) {
    var swapping = false;
    new MutationObserver(function () {
      markLane();
      if (swapping) return;
      swapping = true;
      panel.classList.remove("hub-swap");
      void panel.offsetWidth;
      panel.classList.add("hub-swap");
      setTimeout(function () { swapping = false; }, 60);
    }).observe(panel, { childList: true, subtree: true });
  }

  function step(delta) {
    var list = cards();
    if (!list.length) return;
    var idx = list.findIndex(function (c) { return c.classList.contains("active"); });
    var next = list[(idx + delta + list.length) % list.length] || list[0];
    if (next) {
      next.click();
      next.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  document.addEventListener("keydown", function (e) {
    if (e.target && /input|textarea|select/i.test(e.target.tagName || "")) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); step(1); }
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); step(-1); }
    else if (e.key === " " && typeof window.togglePlay === "function") { e.preventDefault(); window.togglePlay(); }
  });

  var controls = document.querySelector(".explainer-controls");
  if (controls && !controls.querySelector(".hub-hint")) {
    var hint = document.createElement("span");
    hint.className = "hub-hint";
    hint.innerHTML = "<kbd>\\u2190</kbd><kbd>\\u2192</kbd> step \\u00b7 <kbd>space</kbd> play";
    controls.appendChild(hint);
  }

  markLane();
})();
</script>
`;
