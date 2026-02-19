// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const OPPOSITE = { N:'S', E:'W', S:'N', W:'E' };
const MOVES    = { N:[0,-1], E:[1,0], S:[0,1], W:[-1,0] };
const DIRS     = ['N','E','S','W'];

const ALGO_INFO = {
  generate: 'DFS maze generation uses a randomized depth-first search with backtracking to carve a perfect maze where every cell is reachable.',
  bfs:      'BFS (Breadth-First Search) explores all neighbors level by level. Guarantees the shortest path in unweighted graphs.',
  astar:    'A* uses a heuristic (Manhattan distance) to guide search toward the goal. Optimal and typically faster than BFS/Dijkstra.',
  dijkstra: "Dijkstra's algorithm explores by smallest accumulated cost. Optimal for weighted graphs; behaves like BFS on uniform-cost mazes.",
};

const STACK_LABELS = {
  generate: '📚 DFS Stack',
  bfs:      '📬 BFS Queue',
  astar:    '🔮 A* Open Set',
  dijkstra: '📊 Dijkstra Queue',
};

// ─── STATE ───────────────────────────────────────────────────────────────────
let mazeSize   = 5;
let phase      = 'generate';   // 'generate' | 'solve'
let solveAlgo  = 'bfs';
let genSteps   = [];
let solveSteps = [];
let curStep    = 0;
let speed      = 300;
let playing    = false;
let timer      = null;
let finalGrid  = null;

// ─── GRID UTILS ──────────────────────────────────────────────────────────────
function makeGrid(size) {
  return Array.from({length: size}, () =>
    Array.from({length: size}, () => ({N:true, E:true, S:true, W:true, visited:false}))
  );
}
function cloneGrid(g) { return g.map(r => r.map(c => ({...c}))); }

// ─── DFS GENERATION ──────────────────────────────────────────────────────────
function buildDFSSteps(size) {
  const grid  = makeGrid(size);
  const steps = [];
  const stack = [];
  let x = 0, y = 0;

  grid[y][x].visited = true;
  steps.push({type:'visit', x, y, msg:`Start at Entry (0,0)`, grid:cloneGrid(grid), stack:[...stack]});

  let visited = 1;
  const total = size * size;

  while (visited < total) {
    const nbrs = DIRS
      .filter(d => { const [dx,dy]=MOVES[d]; const [nx,ny]=[x+dx,y+dy]; return nx>=0&&nx<size&&ny>=0&&ny<size&&!grid[ny][nx].visited; })
      .map(d => ({d, nx:x+MOVES[d][0], ny:y+MOVES[d][1]}));

    if (nbrs.length) {
      const {d, nx, ny} = nbrs[Math.floor(Math.random()*nbrs.length)];
      stack.push([x,y]);
      grid[y][x][d] = false;
      grid[ny][nx][OPPOSITE[d]] = false;
      [x,y] = [nx,ny];
      grid[y][x].visited = true;
      visited++;
      steps.push({type:'move', x, y, msg:`Move ${d} to (${x},${y}) — wall removed`, grid:cloneGrid(grid), stack:[...stack]});
    } else if (stack.length) {
      [x,y] = stack.pop();
      steps.push({type:'backtrack', x, y, msg:`Backtrack to (${x},${y})`, grid:cloneGrid(grid), stack:[...stack]});
    }
  }
  steps.push({type:'complete', x, y, msg:'✅ Maze generation complete!', grid:cloneGrid(grid), stack:[]});
  return steps;
}

// ─── PATH BUILDER ────────────────────────────────────────────────────────────
function buildPath(parents, ex, ey) {
  const path = [];
  let key = `${ex},${ey}`;
  while (key && key !== '0,0') {
    const [kx,ky] = key.split(',').map(Number);
    path.unshift([kx,ky]);
    key = parents[key]?.[0] ?? null;
  }
  path.unshift([0,0]);
  return path;
}

// ─── BFS SOLVING ─────────────────────────────────────────────────────────────
function buildBFSSteps(grid, size) {
  const steps   = [];
  const [ex,ey] = [size-1, size-1];
  const queue   = [[0,0]];
  const visited = new Set(['0,0']);
  const parents = {'0,0':[null,'']};

  steps.push({type:'start', cur:[0,0], msg:'BFS from (0,0)', queue:[...queue], visited:new Set(visited), path:[], grid});

  while (queue.length) {
    const [x,y] = queue.shift();
    steps.push({type:'explore', cur:[x,y], msg:`Exploring (${x},${y})`, queue:[...queue], visited:new Set(visited), path:[], grid});

    if (x===ex && y===ey) {
      const path = buildPath(parents, ex, ey);
      steps.push({type:'found', cur:[x,y], msg:`🎉 Found exit! Path length: ${path.length-1}`, queue:[], visited:new Set(visited), path, grid});
      break;
    }

    for (const d of DIRS) {
      if (!grid[y][x][d]) {
        const [nx,ny] = [x+MOVES[d][0], y+MOVES[d][1]];
        const key = `${nx},${ny}`;
        if (nx>=0&&nx<size&&ny>=0&&ny<size&&!visited.has(key)) {
          visited.add(key);
          parents[key] = [`${x},${y}`, d];
          queue.push([nx,ny]);
          steps.push({type:'add', cur:[x,y], msg:`Queue (${nx},${ny})`, queue:[...queue], visited:new Set(visited), path:[], grid});
        }
      }
    }
  }
  return steps;
}

// ─── A* SOLVING ──────────────────────────────────────────────────────────────
function buildAStarSteps(grid, size) {
  const steps     = [];
  const [ex,ey]   = [size-1, size-1];
  const h         = (x,y) => Math.abs(x-ex)+Math.abs(y-ey);
  const gScore    = {'0,0':0};
  const fScore    = {'0,0':h(0,0)};
  const openSet   = [[0,0]];
  const closedSet = [];
  const parents   = {'0,0':[null,'']};

  steps.push({type:'start', cur:[0,0], msg:'A* from (0,0)', openSet:[...openSet], closedSet:[], path:[], grid, gScore:{...gScore}, fScore:{...fScore}});

  while (openSet.length) {
    openSet.sort((a,b)=>(fScore[`${a[0]},${a[1]}`]??Infinity)-(fScore[`${b[0]},${b[1]}`]??Infinity));
    const [x,y] = openSet.shift();
    const key   = `${x},${y}`;
    closedSet.push([x,y]);

    steps.push({type:'explore', cur:[x,y], msg:`A* at (${x},${y}) | f=${fScore[key]?.toFixed(1)}`, openSet:[...openSet], closedSet:[...closedSet], path:[], grid, gScore:{...gScore}, fScore:{...fScore}});

    if (x===ex && y===ey) {
      const path = buildPath(parents, ex, ey);
      steps.push({type:'found', cur:[x,y], msg:`🎉 A* found optimal path! Length: ${path.length-1}`, openSet:[], closedSet:[...closedSet], path, grid, gScore:{...gScore}, fScore:{...fScore}});
      break;
    }

    for (const d of DIRS) {
      if (!grid[y][x][d]) {
        const [nx,ny] = [x+MOVES[d][0], y+MOVES[d][1]];
        const nKey = `${nx},${ny}`;
        if (closedSet.some(([cx,cy])=>cx===nx&&cy===ny)) continue;
        const tg = (gScore[key]??Infinity)+1;
        if (tg < (gScore[nKey]??Infinity)) {
          parents[nKey] = [key, d];
          gScore[nKey]  = tg;
          fScore[nKey]  = tg + h(nx,ny);
          if (!openSet.some(([ox,oy])=>ox===nx&&oy===ny)) {
            openSet.push([nx,ny]);
            steps.push({type:'add', cur:[x,y], msg:`Add (${nx},${ny}) | f=${fScore[nKey].toFixed(1)}`, openSet:[...openSet], closedSet:[...closedSet], path:[], grid, gScore:{...gScore}, fScore:{...fScore}});
          }
        }
      }
    }
  }
  return steps;
}

// ─── DIJKSTRA SOLVING ────────────────────────────────────────────────────────
function buildDijkstraSteps(grid, size) {
  const steps   = [];
  const [ex,ey] = [size-1, size-1];
  const dist    = {'0,0':0};
  const parents = {'0,0':[null,'']};
  const pq      = [[0,0]];
  const visited = new Set();

  steps.push({type:'start', cur:[0,0], msg:"Dijkstra from (0,0)", pq:[...pq], dist:{...dist}, path:[], grid});

  while (pq.length) {
    pq.sort((a,b)=>(dist[`${a[0]},${a[1]}`]??Infinity)-(dist[`${b[0]},${b[1]}`]??Infinity));
    const [x,y] = pq.shift();
    const key   = `${x},${y}`;
    if (visited.has(key)) continue;
    visited.add(key);

    steps.push({type:'explore', cur:[x,y], msg:`Dijkstra at (${x},${y}) | dist=${dist[key]}`, pq:[...pq], dist:{...dist}, path:[], grid});

    if (x===ex && y===ey) {
      const path = buildPath(parents, ex, ey);
      steps.push({type:'found', cur:[x,y], msg:`🎉 Dijkstra found path! Distance: ${dist[key]}`, pq:[], dist:{...dist}, path, grid});
      break;
    }

    for (const d of DIRS) {
      if (!grid[y][x][d]) {
        const [nx,ny] = [x+MOVES[d][0], y+MOVES[d][1]];
        const nKey = `${nx},${ny}`;
        if (!visited.has(nKey)) {
          const nd = (dist[key]??Infinity)+1;
          if (nd < (dist[nKey]??Infinity)) {
            dist[nKey]    = nd;
            parents[nKey] = [key, d];
            pq.push([nx,ny]);
            steps.push({type:'add', cur:[x,y], msg:`Update (${nx},${ny}) dist=${nd}`, pq:[...pq], dist:{...dist}, path:[], grid});
          }
        }
      }
    }
  }
  return steps;
}

// ─── RENDER ──────────────────────────────────────────────────────────────────
function renderMaze() {
  const steps    = phase==='generate' ? genSteps : solveSteps;
  const stepData = steps[curStep];
  if (!stepData) return;

  const grid       = stepData.grid || finalGrid || makeGrid(mazeSize);
  const cur        = phase==='generate' ? [stepData.x, stepData.y] : stepData.cur;
  const path       = stepData.path || [];
  const openSet    = stepData.openSet || [];
  const closedSet  = stepData.closedSet || [];
  const visitedSet = stepData.visited || null;
  const gScore     = stepData.gScore || null;
  const fScore     = stepData.fScore || null;
  const showScores = document.getElementById('score-toggle').checked && phase==='solve';
  const [ex,ey]    = [mazeSize-1, mazeSize-1];

  const cs = mazeSize<=3?110:mazeSize<=4?92:mazeSize<=5?78:mazeSize<=6?66:mazeSize<=7?57:51;
  const mazeEl = document.getElementById('maze');
  mazeEl.style.gridTemplateColumns = `repeat(${mazeSize}, ${cs}px)`;
  mazeEl.style.gridTemplateRows    = `repeat(${mazeSize}, ${cs}px)`;

  let html = '';
  for (let y=0; y<mazeSize; y++) {
    for (let x=0; x<mazeSize; x++) {
      const cell = grid[y][x];
      const key  = `${x},${y}`;
      const isCur    = cur && cur[0]===x && cur[1]===y;
      const isPath   = path.some(([px,py])=>px===x&&py===y);
      const isOpen   = openSet.some(([ox,oy])=>ox===x&&oy===y);
      const isClosed = closedSet.some(([cx,cy])=>cx===x&&cy===y);
      const isVisited= visitedSet ? visitedSet.has(key) : cell.visited;

      let cls = 'cell';
      if (!cell.N) cls+=' wall-N';
      if (!cell.E) cls+=' wall-E';
      if (!cell.S) cls+=' wall-S';
      if (!cell.W) cls+=' wall-W';
      if (isCur)         cls+=' current';
      else if (isPath)   cls+=' path';
      else if (isOpen)   cls+=' open-set';
      else if (isClosed) cls+=' closed-set';
      else if (isVisited)cls+=' visited';

      const markerSize = mazeSize<=4?26:mazeSize<=6?20:15;
      let inner = '';
      if (x===0&&y===0)   inner += `<span class="marker" style="font-size:${markerSize}px">🚀</span>`;
      if (x===ex&&y===ey) inner += `<span class="marker" style="font-size:${markerSize}px">🏁</span>`;
      if (showScores && gScore && fScore && !(x===0&&y===0) && !(x===ex&&y===ey)) {
        const g = gScore[key]; const f = fScore[key];
        if (g!==undefined||f!==undefined) inner += `<div class="scores">${g!==undefined?'g:'+g:''}<br/>${f!==undefined?'f:'+f:''}</div>`;
      }
      inner += `<div class="coord">${x},${y}</div>`;
      html += `<div class="${cls}" style="width:${cs}px;height:${cs}px">${inner}</div>`;
    }
  }
  mazeEl.innerHTML = html;

  // Path banner
  const banner = document.getElementById('path-banner');
  if (phase==='solve' && path.length>1) {
    banner.textContent = `✅ Path found! Length: ${path.length-1} steps`;
    banner.classList.add('show');
  } else {
    banner.classList.remove('show');
  }
}

// ─── UPDATE UI ───────────────────────────────────────────────────────────────
function updateUI() {
  const steps = phase==='generate' ? genSteps : solveSteps;
  if (!steps.length) return;
  const stepData = steps[curStep];

  document.getElementById('step-counter').textContent = `Step ${curStep+1} / ${steps.length}`;
  document.getElementById('progress-fill').style.width = steps.length>1 ? `${(curStep/(steps.length-1))*100}%` : '0%';
  document.getElementById('step-type').textContent = (stepData.type||'').toUpperCase();
  document.getElementById('step-msg').textContent  = stepData.msg || stepData.message || '';

  // Stack/queue
  let items = [];
  if (phase==='generate') {
    items = (stepData.stack||[]).slice().reverse().map(([x,y])=>`(${x},${y})`);
  } else if (solveAlgo==='bfs') {
    items = (stepData.queue||[]).map(([x,y])=>`(${x},${y})`);
  } else if (solveAlgo==='astar') {
    const fs = stepData.fScore||{};
    items = (stepData.openSet||[]).map(([x,y])=>`(${x},${y}) f=${fs[`${x},${y}`]?.toFixed(1)??'?'}`);
  } else {
    const ds = stepData.dist||{};
    items = (stepData.pq||[]).slice(0,12).map(([x,y])=>`(${x},${y}) d=${ds[`${x},${y}`]??'∞'}`);
  }
  const sl = document.getElementById('stack-list');
  const more = items.length>12 ? `<div style="font-size:0.62rem;color:rgba(255,255,255,0.25);text-align:center;margin-top:3px">+${items.length-12} more...</div>` : '';
  sl.innerHTML = items.length
    ? items.slice(0,12).map(t=>`<div class="stack-item">${t}</div>`).join('')+more
    : '<span class="stack-empty">empty</span>';

  // Buttons
  document.getElementById('btn-prev').disabled = curStep===0;
  document.getElementById('btn-next').disabled = curStep>=steps.length-1;
  document.getElementById('btn-play').textContent = playing ? '⏸ PAUSE' : '▶ PLAY';
  document.getElementById('btn-play').className   = playing ? 'btn btn-red' : 'btn btn-green';

  renderMaze();
}

// ─── CONTROLS ────────────────────────────────────────────────────────────────
function stopTimer() {
  clearInterval(timer);
  timer = null;
  playing = false;
}

function togglePlay() {
  const steps = phase==='generate' ? genSteps : solveSteps;
  if (playing) { stopTimer(); updateUI(); return; }
  if (curStep >= steps.length-1) curStep = 0;
  playing = true;
  timer = setInterval(() => {
    const s = phase==='generate' ? genSteps : solveSteps;
    if (curStep >= s.length-1) { stopTimer(); updateUI(); return; }
    curStep++;
    updateUI();
  }, speed);
  updateUI();
}

function stepForward() {
  const steps = phase==='generate' ? genSteps : solveSteps;
  if (curStep < steps.length-1) { curStep++; updateUI(); }
}
function stepBackward() {
  if (curStep > 0) { curStep--; updateUI(); }
}

function updateSpeed(v) {
  speed = +v;
  document.getElementById('speed-val').textContent = v+'ms';
  if (playing) { stopTimer(); togglePlay(); }
}

function changeSize(s) {
  stopTimer();
  mazeSize = s;
  document.querySelectorAll('.size-btn').forEach((b,i)=>{ b.classList.toggle('active', [3,4,5,6,7,8][i]===s); });
  resetAll();
}

function resetAll() {
  stopTimer();
  curStep    = 0;
  finalGrid  = null;
  solveSteps = [];
  phase      = 'generate';
  genSteps   = buildDFSSteps(mazeSize);
  syncTabs();
  updateUI();
}

function switchPhase(p) {
  stopTimer();
  if (p==='generate') {
    phase   = 'generate';
    curStep = 0;
  } else {
    // use completed maze
    const lastGen = genSteps[genSteps.length-1];
    if (!lastGen) return;
    finalGrid  = lastGen.grid;
    solveSteps = buildSolveSteps(finalGrid);
    phase      = 'solve';
    curStep    = 0;
  }
  syncTabs();
  updateUI();
}

function switchSolveAlgo(algo) {
  stopTimer();
  solveAlgo = algo;
  document.querySelectorAll('.algo-pill').forEach(p => p.className='algo-pill');
  document.getElementById(`pill-${algo==='dijkstra'?'dijk':algo}`).classList.add(`active-${algo==='dijkstra'?'dijk':algo}`);
  document.getElementById('stack-label').textContent = STACK_LABELS[algo];
  document.getElementById('algo-info-text').textContent = ALGO_INFO[algo];
  if (phase==='solve' && finalGrid) {
    solveSteps = buildSolveSteps(finalGrid);
    curStep    = 0;
    updateUI();
  }
}

function buildSolveSteps(grid) {
  if (solveAlgo==='bfs')      return buildBFSSteps(grid, mazeSize);
  if (solveAlgo==='astar')    return buildAStarSteps(grid, mazeSize);
  if (solveAlgo==='dijkstra') return buildDijkstraSteps(grid, mazeSize);
  return buildBFSSteps(grid, mazeSize);
}

function syncTabs() {
  const tg = document.getElementById('tab-gen');
  const ts = document.getElementById('tab-solve');
  tg.className = phase==='generate' ? 'tab active-gen' : 'tab';
  ts.className = phase==='solve'    ? 'tab active-solve' : 'tab';
  document.getElementById('stack-label').textContent = phase==='generate' ? STACK_LABELS.generate : STACK_LABELS[solveAlgo];
  document.getElementById('algo-info-text').textContent = phase==='generate' ? ALGO_INFO.generate : ALGO_INFO[solveAlgo];
  // show/hide score toggle
  document.getElementById('score-toggle-label').style.display = phase==='solve' ? 'flex' : 'none';
}

// ─── INIT ────────────────────────────────────────────────────────────────────
window.onload = () => {
  // Set size-5 active
  document.querySelectorAll('.size-btn').forEach((b,i) => { b.classList.toggle('active', i===2); });
  genSteps = buildDFSSteps(mazeSize);
  syncTabs();
  updateUI();
};