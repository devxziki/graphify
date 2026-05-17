// HTML export - vis.js visualization
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import { Graph } from 'graphlib';
import { Communities, FileType, Confidence } from '../types/index.js';
import { graphNodes, graphEdges, graphDegrees } from '../utils/graphlib.js';

// Community colors (matching Python version)
const COMMUNITY_COLORS = [
  '#4E79A7', '#F28E2B', '#E15759', '#76B7B2', '#59A14F',
  '#EDC948', '#B07AA1', '#FF9DA7', '#9C755F', '#BAB0AC'
];

const MAX_NODES_FOR_VIZ = 5000;

/**
 * HTML styles for the visualization
 */
const HTML_STYLES = `
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0f0f1a; color: #e0e0e0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; display: flex; height: 100vh; overflow: hidden; }
  #graph { flex: 1; }
  #sidebar { width: 280px; background: #1a1a2e; border-left: 1px solid #2a2a4e; display: flex; flex-direction: column; overflow: hidden; }
  #search-wrap { padding: 12px; border-bottom: 1px solid #2a2a4e; }
  #search { width: 100%; background: #0f0f1a; border: 1px solid #3a3a5e; color: #e0e0e0; padding: 7px 10px; border-radius: 6px; font-size: 13px; outline: none; }
  #search:focus { border-color: #4E79A7; }
  #search-results { max-height: 140px; overflow-y: auto; padding: 4px 12px; border-bottom: 1px solid #2a2a4e; display: none; }
  .search-item { padding: 4px 6px; cursor: pointer; border-radius: 4px; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .search-item:hover { background: #2a2a4e; }
  #info-panel { padding: 14px; border-bottom: 1px solid #2a2a4e; min-height: 140px; }
  #info-panel h3 { font-size: 13px; color: #aaa; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
  #info-content { font-size: 13px; color: #ccc; line-height: 1.6; }
  #info-content .field { margin-bottom: 5px; }
  #info-content .field b { color: #e0e0e0; }
  #info-content .empty { color: #555; font-style: italic; }
  .neighbor-link { display: block; padding: 2px 6px; margin: 2px 0; border-radius: 3px; cursor: pointer; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border-left: 3px solid #333; }
  .neighbor-link:hover { background: #2a2a4e; }
  #neighbors-list { max-height: 160px; overflow-y: auto; margin-top: 4px; }
  #legend-wrap { flex: 1; overflow-y: auto; padding: 12px; }
  #legend-wrap h3 { font-size: 13px; color: #aaa; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
  .legend-item { display: flex; align-items: center; gap: 8px; padding: 4px 0; cursor: pointer; border-radius: 4px; font-size: 12px; }
  .legend-item:hover { background: #2a2a4e; padding-left: 4px; }
  .legend-item.dimmed { opacity: 0.35; }
  .legend-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
  .legend-label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .legend-count { color: #666; font-size: 11px; }
  #stats { padding: 10px 14px; border-top: 1px solid #2a2a4e; font-size: 11px; color: #555; }
  #legend-controls { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding: 4px 0; }
  #legend-controls label { display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 12px; color: #aaa; user-select: none; }
  .legend-cb { appearance: none; -webkit-appearance: none; width: 14px; height: 14px; border: 1.5px solid #3a3a5e; border-radius: 3px; background: #0f0f1a; cursor: pointer; }
  .legend-cb:checked { background: #4E79A7; border-color: #4E79A7; }
</style>`;

/**
 * Export graph to interactive HTML
 */
export function toHTML(
  G: Graph,
  communities: Communities,
  outputPath: string,
  options: {
    communityLabels?: Record<number, string>;
  } = {}
): void {
  const { communityLabels = {} } = options;

  const allNodes = graphNodes(G);
  const allEdges = graphEdges(G);

  if (allNodes.length > MAX_NODES_FOR_VIZ) {
    console.error(`[graphify] Graph has ${allNodes.length} nodes - too large for HTML viz (limit: ${MAX_NODES_FOR_VIZ}). Use --no-viz to skip.`);
    return;
  }

  // Ensure directory exists
  const dir = dirname(outputPath);
  if (dir && !existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Get node community map
  const nodeCommunity: Map<string, number> = new Map();
  for (const [cid, nodes] of Object.entries(communities)) {
    for (const node of nodes) {
      nodeCommunity.set(node, parseInt(cid));
    }
  }

  // Calculate degree using helper
  const degree = graphDegrees(G);
  const maxDegree = Math.max(...Object.values(degree), 1);

  // Build vis.js nodes
  const visNodes = allNodes.map(nodeId => {
    const data = G.node(nodeId) as Record<string, unknown>;
    const cid = nodeCommunity.get(nodeId) || 0;
    const color = COMMUNITY_COLORS[cid % COMMUNITY_COLORS.length];
    const deg = degree[nodeId] || 1;

    const size = 10 + 30 * (deg / maxDegree);
    const fontSize = deg >= maxDegree * 0.15 ? 12 : 0;

    return {
      id: nodeId,
      label: (data.label as string) || nodeId,
      color: { background: color, border: color, highlight: { background: '#ffffff', border: color } },
      size: Math.round(size * 10) / 10,
      font: { size: fontSize, color: '#ffffff' },
      title: (data.label as string) || nodeId,
      community: cid,
      community_name: communityLabels[cid] || `Community ${cid}`,
      source_file: (data.source_file as string) || '',
      file_type: (data.file_type as string) || 'unknown',
      degree: deg
    };
  });

  // Build vis.js edges
  const visEdges = allEdges.map(([u, v], i) => {
    const data = G.edge(u, v) as Record<string, unknown>;
    const confidence = (data.confidence as Confidence) || 'EXTRACTED';
    const relation = (data.relation as string) || '';

    const trueSrc = data._src as string || u;
    const trueTgt = data._tgt as string || v;

    return {
      id: i,
      from: trueSrc,
      to: trueTgt,
      label: '',
      title: `${relation} [${confidence}]`,
      dashes: confidence !== 'EXTRACTED',
      width: confidence === 'EXTRACTED' ? 2 : 1,
      color: { opacity: confidence === 'EXTRACTED' ? 0.7 : 0.35 },
      arrows: { to: { enabled: true, scaleFactor: 0.5 } }
    };
  });

  // Build legend
  const legendData = Object.keys(communities).map(cid => {
    const c = parseInt(cid);
    return {
      cid: c,
      color: COMMUNITY_COLORS[c % COMMUNITY_COLORS.length],
      label: communityLabels[c] || `Community ${c}`,
      count: communities[c].length
    };
  }).sort((a, b) => a.cid - b.cid);

  // Generate HTML
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>graphify</title>
<script src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
${HTML_STYLES}
</head>
<body>
<div id="graph"></div>
<div id="sidebar">
  <div id="search-wrap">
    <input id="search" type="text" placeholder="Search nodes..." autocomplete="off">
    <div id="search-results"></div>
  </div>
  <div id="info-panel">
    <h3>Node Info</h3>
    <div id="info-content"><span class="empty">Click a node to inspect it</span></div>
  </div>
  <div id="legend-wrap">
    <h3>Communities</h3>
    <div id="legend"></div>
  </div>
  <div id="stats">${allNodes.length} nodes · ${allEdges.length} edges · ${Object.keys(communities).length} communities</div>
</div>
<script>
const RAW_NODES = ${JSON.stringify(visNodes)};
const RAW_EDGES = ${JSON.stringify(visEdges)};
const LEGEND = ${JSON.stringify(legendData)};

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

const nodesDS = new vis.DataSet(RAW_NODES.map(n => ({
  id: n.id, label: n.label, color: n.color, size: n.size,
  font: n.font, title: n.title,
  _community: n.community, _community_name: n.community_name,
  _source_file: n.source_file, _file_type: n.file_type, _degree: n.degree,
})));

const edgesDS = new vis.DataSet(RAW_EDGES.map((e, i) => ({
  id: i, from: e.from, to: e.to, label: '', title: e.title,
  dashes: e.dashes, width: e.width, color: e.color,
  arrows: e.arrows,
})));

const container = document.getElementById('graph');
const network = new vis.Network(container, { nodes: nodesDS, edges: edgesDS }, {
  physics: {
    enabled: true,
    solver: 'forceAtlas2Based',
    forceAtlas2Based: {
      gravitationalConstant: -60,
      centralGravity: 0.005,
      springLength: 120,
      springConstant: 0.08,
      damping: 0.4,
      avoidOverlap: 0.8,
    },
    stabilization: { iterations: 200, fit: true },
  },
  interaction: {
    hover: true,
    tooltipDelay: 100,
    hideEdgesOnDrag: true,
    navigationButtons: false,
    keyboard: false,
  },
  nodes: { shape: 'dot', borderWidth: 1.5 },
  edges: { smooth: { type: 'continuous', roundness: 0.2 }, selectionWidth: 3 },
});

network.once('stabilizationIterationsDone', () => {
  network.setOptions({ physics: { enabled: false } });
});

function showInfo(nodeId) {
  const n = nodesDS.get(nodeId);
  if (!n) return;
  const neighborIds = network.getConnectedNodes(nodeId);
  const neighborItems = neighborIds.map(nid => {
    const nb = nodesDS.get(nid);
    const color = nb ? nb.color.background : '#555';
    return '<span class="neighbor-link" style="border-left-color:'+esc(color)+'" onclick="focusNode('+JSON.stringify(nid)+')">'+esc(nb ? nb.label : nid)+'</span>';
  }).join('');
  document.getElementById('info-content').innerHTML = '<div class="field"><b>'+esc(n.label)+'</b></div><div class="field">Type: '+esc(n._file_type || 'unknown')+'</div><div class="field">Community: '+esc(n._community_name)+'</div><div class="field">Source: '+esc(n._source_file || '-')+'</div><div class="field">Degree: '+n._degree+'</div>'+(neighborIds.length ? '<div class="field" style="margin-top:8px;color:#aaa;font-size:11px">Neighbors ('+neighborIds.length+')</div><div id="neighbors-list">'+neighborItems+'</div>' : '');
}

function focusNode(nodeId) {
  network.focus(nodeId, { scale: 1.4, animation: true });
  network.selectNodes([nodeId]);
  showInfo(nodeId);
}

let hoveredNodeId = null;
network.on('hoverNode', params => { hoveredNodeId = params.node; container.style.cursor = 'pointer'; });
network.on('blurNode', () => { hoveredNodeId = null; container.style.cursor = 'default'; });
container.addEventListener('click', () => { if (hoveredNodeId !== null) { showInfo(hoveredNodeId); network.selectNodes([hoveredNodeId]); } });
network.on('click', params => { if (params.nodes.length > 0) { showInfo(params.nodes[0]); } else if (hoveredNodeId === null) { document.getElementById('info-content').innerHTML = '<span class="empty">Click a node to inspect it</span>'; } });

const searchInput = document.getElementById('search');
const searchResults = document.getElementById('search-results');
searchInput.addEventListener('input', () => {
  const q = searchInput.value.toLowerCase().trim();
  searchResults.innerHTML = '';
  if (!q) { searchResults.style.display = 'none'; return; }
  const matches = RAW_NODES.filter(n => n.label.toLowerCase().includes(q)).slice(0, 20);
  if (!matches.length) { searchResults.style.display = 'none'; return; }
  searchResults.style.display = 'block';
  matches.forEach(n => {
    const el = document.createElement('div');
    el.className = 'search-item';
    el.textContent = n.label;
    el.style.borderLeft = '3px solid ' + n.color.background;
    el.style.paddingLeft = '8px';
    el.onclick = () => { network.focus(n.id, { scale: 1.5, animation: true }); network.selectNodes([n.id]); showInfo(n.id); searchResults.style.display = 'none'; searchInput.value = ''; };
    searchResults.appendChild(el);
  });
});

const hiddenCommunities = new Set();
const legendEl = document.getElementById('legend');
LEGEND.forEach(c => {
  const item = document.createElement('div');
  item.className = 'legend-item';
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.className = 'legend-cb';
  cb.checked = true;
  cb.addEventListener('change', (e) => {
    if (cb.checked) { hiddenCommunities.delete(c.cid); item.classList.remove('dimmed'); }
    else { hiddenCommunities.add(c.cid); item.classList.add('dimmed'); }
    const updates = RAW_NODES.filter(n => n.community === c.cid).map(n => ({ id: n.id, hidden: !cb.checked }));
    nodesDS.update(updates);
  });
  item.innerHTML = '<div class="legend-dot" style="background:'+c.color+'"></div><span class="legend-label">'+esc(c.label)+'</span><span class="legend-count">'+c.count+'</span>';
  item.prepend(cb);
  item.onclick = (e) => { if (e.target === cb) return; cb.checked = !cb.checked; cb.dispatchEvent(new Event('change')); };
  legendEl.appendChild(item);
});
</script>
</body>
</html>`;

  writeFileSync(outputPath, html);
}

export default {
  toHTML
};