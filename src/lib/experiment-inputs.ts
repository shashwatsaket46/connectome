// Adds the consolidated anchor-type input to the pipeline walkthrough's
// "Inputs" lane. The bundle ships three inputs (Adult.h5ad,
// visual_neuron_types.csv.gz, connections_princeton.csv.gz); the lab's
// consolidated anchor table is the fourth — it is what actually ties a
// FlyWire connectome row to an Adult single-cell row via root_id.
export const EXPERIMENT_INPUTS_SCRIPT = `
<script>
(function () {
  var NODE = {
    id: "in-anchors",
    lane: "Inputs",
    icon: "\\uD83D\\uDD11",
    title: "consolidated_anchor_types.csv",
    subtitle: "root_id \\u2192 consolidated anchor type",
    desc: "The lab-curated anchor table that joins the two halves of the pipeline: every FlyWire root_id is mapped to a single consolidated anchor type, and that anchor type is what the Adult single-cell data is matched against. Without it the connectome rows (FlyWire types) and the transcriptome rows (Adult cells) have no shared vocabulary \\u2014 the visual_neuron_types labels alone are finer-grained, inconsistent across releases, and leave many cells unmatched.",
    x_axis: "Columns: root_id, flywire type, consolidated anchor type, source/confidence",
    y_axis: "Rows: one per annotated FlyWire neuron (root_id is the join key)",
    interpretation: "Read it as the dictionary between datasets. root_id keys the FlyWire side; the consolidated anchor type is the merged label that both C (connectome) and the Adult expression matrix are indexed by, so P can put an Adult cell onto a connectome type at all."
  };

  function inputsLane() {
    var lanes = document.querySelectorAll(".lane");
    for (var i = 0; i < lanes.length; i++) {
      var h = lanes[i].querySelector(".lane-header h3");
      if (h && /input/i.test(h.textContent || "")) return lanes[i];
    }
    return null;
  }

  function install() {
    if (document.querySelector('.node-card[data-id="in-anchors"]')) return true;
    var lane = inputsLane();
    if (!lane) return false;
    var cards = lane.querySelector(".lane-cards");
    if (!cards) return false;

    var list = null;
    try { list = PIPELINE_NODES; } catch (e) { list = null; }
    if (!list && window.PIPELINE_NODES) list = window.PIPELINE_NODES;
    if (list && !list.some(function (n) { return n.id === NODE.id; })) {
      var at = list.map(function (n) { return n.id; }).indexOf("in-conn");
      list.splice(at === -1 ? list.length : at + 1, 0, NODE);
    }

    var btn = document.createElement("button");
    btn.className = "node-card";
    btn.setAttribute("data-id", NODE.id);
    btn.innerHTML =
      '<span class="node-icon">' + NODE.icon + '</span>' +
      '<span class="node-title">' + NODE.title + '</span>' +
      '<span class="node-subtitle">' + NODE.subtitle + '</span>';
    btn.addEventListener("click", function () {
      if (typeof window.selectNode === "function") window.selectNode(NODE.id);
    });
    cards.appendChild(btn);
    return true;
  }

  if (!install()) {
    var tries = 0;
    var t = setInterval(function () {
      if (install() || ++tries > 40) clearInterval(t);
    }, 150);
  }
})();
</script>
`;
