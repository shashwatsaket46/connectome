// Injected into every proxied experiment bundle. It turns the Plotly dropdown
// menus inside a bundle into sections the hub shell can render as its own menu,
// and lets the shell activate one of them.
export const EXPERIMENT_BRIDGE_SCRIPT = `
<script>
(function () {
  var applied = null;

  function graphs() {
    return Array.prototype.slice.call(document.querySelectorAll(".plotly-graph-div"));
  }

  function collect() {
    var sections = [];
    graphs().forEach(function (gd, gi) {
      var menus = (gd.layout && gd.layout.updatemenus) || [];
      menus.forEach(function (menu, mi) {
        (menu.buttons || []).forEach(function (btn, bi) {
          sections.push({
            key: gi + ":" + mi + ":" + bi,
            label: String(btn.label || "Option " + (bi + 1)).replace(/\\s+/g, " ").trim(),
            group: (menu.name || menu.title || "") + "",
          });
        });
      });
    });
    // Bundles that drive their views from a plain <select> (e.g. the ablation
    // explorer) expose each option as a hub section too.
    Array.prototype.slice.call(document.querySelectorAll("select")).forEach(function (sel, si) {
      Array.prototype.slice.call(sel.options || []).forEach(function (opt, oi) {
        sections.push({
          key: "sel:" + si + ":" + oi,
          label: String(opt.textContent || opt.value || "Option " + (oi + 1)).replace(/\\s+/g, " ").trim(),
          group: "",
        });
      });
    });
    return sections;
  }

  // The hub sidebar renders these menus, so hide the in-page Plotly dropdowns.
  function hideMenus() {
    if (!document.getElementById("hub-hide-updatemenus")) {
      var style = document.createElement("style");
      style.id = "hub-hide-updatemenus";
      style.textContent = ".updatemenu-container { display: none !important; } label:has(#exp-select) { display: none !important; }";
      document.head.appendChild(style);
    }
  }

  function report() {
    var sections = collect();
    if (!sections.length) return false;
    hideMenus();
    paint();
    parent.postMessage({ type: "hub:sections", sections: sections }, "*");
    return true;
  }

  function select(key) {
    if (!key || applied === key) return;
    var parts = String(key).split(":");
    if (parts[0] === "sel") {
      var sel = document.querySelectorAll("select")[Number(parts[1])];
      if (!sel) return;
      applied = key;
      sel.selectedIndex = Number(parts[2]);
      sel.dispatchEvent(new Event("change", { bubbles: true }));
      parent.postMessage({ type: "hub:selected", key: key }, "*");
      setTimeout(paint, 300);
      setTimeout(paint, 1200);
      return;
    }
    var gd = graphs()[Number(parts[0])];
    if (!gd || !window.Plotly) return;
    var menu = ((gd.layout && gd.layout.updatemenus) || [])[Number(parts[1])];
    if (!menu) return;
    var btn = (menu.buttons || [])[Number(parts[2])];
    if (!btn) return;
    applied = key;
    var args = btn.args || [];
    try {
      if (btn.method === "relayout") window.Plotly.relayout(gd, args[0] || {});
      else if (btn.method === "restyle") window.Plotly.restyle(gd, args[0] || {}, args[1]);
      else window.Plotly.update(gd, args[0] || {}, args[1] || {});
      parent.postMessage({ type: "hub:selected", key: key }, "*");
      setTimeout(paint, 200);
      setTimeout(paint, 1200);
      var patch = {};
      patch["updatemenus[" + Number(parts[1]) + "].active"] = Number(parts[2]);
      window.Plotly.relayout(gd, patch);
    } catch (err) {
      /* ignore */
    }
  }


  // Repaint Plotly figures for the hub theme. Colors only — no data changes.
  var darkMode = false;
  function paint() {
    graphs().forEach(function (gd) {
      try {
        var patch = darkMode
          ? {
              paper_bgcolor: "#0d1220",
              plot_bgcolor: "#111827",
              "font.color": "#e6ecfb",
              "legend.bgcolor": "rgba(0,0,0,0)",
              "legend.font.color": "#e6ecfb",
            }
          : {
              paper_bgcolor: "#ffffff",
              plot_bgcolor: "#ffffff",
              "font.color": "#131a2b",
              "legend.bgcolor": "rgba(0,0,0,0)",
              "legend.font.color": "#131a2b",
            };
        Object.keys(gd.layout || {}).forEach(function (k) {
          if (/^[xy]axis/.test(k)) {
            patch[k + ".gridcolor"] = darkMode ? "#27314a" : "#eaeaea";
            patch[k + ".zerolinecolor"] = darkMode ? "#27314a" : "#eaeaea";
            patch[k + ".linecolor"] = darkMode ? "#3a445f" : "#444";
            patch[k + ".color"] = darkMode ? "#c7d2e8" : "#131a2b";
          }
        });
        delete patch["undefined"];
        var anns = (gd.layout || {}).annotations;
        if (anns) {
          anns.forEach(function (a, i) {
            patch["annotations[" + i + "].font.color"] = darkMode ? "#e6ecfb" : "#131a2b";
          });
        }
        window.Plotly.relayout(gd, patch);
      } catch (err) {
        /* ignore */
      }
    });
  }

  function setTheme(t) {
    darkMode = t === "dark";
    document.documentElement.classList.toggle("hub-dark", darkMode);
    paint();
    setTimeout(paint, 800);
    setTimeout(paint, 2500);
  }

  window.addEventListener("message", function (event) {
    var data = event.data;
    if (!data || typeof data.type !== "string") return;
    if (data.type === "hub:select") select(data.key);
    if (data.type === "hub:context") report();
    if (data.type === "hub:theme") setTheme(data.theme);
  });

  // Tell the shell the document is live even when it has no Plotly menus,
  // so the loading overlay can be dismissed.
  parent.postMessage({ type: "hub:ready" }, "*");
  parent.postMessage({ type: "hub:theme?" }, "*");

  var tries = 0;
  var timer = setInterval(function () {
    tries += 1;
    if (report() || tries > 240) clearInterval(timer);
  }, 250);
})();
</script>
`;
