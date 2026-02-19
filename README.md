# 🌀 Maze Algorithm Visualizer

<div align="center">

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**An interactive, step-by-step visualizer for maze generation and pathfinding algorithms.**  
Watch DFS carve a maze, then solve it with BFS, A\*, or Dijkstra — all in a single HTML file.

[Features](#-features) · [Quick Start](#-quick-start) · [Algorithms](#-algorithms) · [Controls](#-controls) · [Project Structure](#-project-structure)

</div>

---

## ✨ Features

- **4 algorithms** — DFS generation, BFS, A\*, and Dijkstra solving
- **Step-by-step playback** — play/pause, next, previous, adjustable speed
- **Live data structures** — stack, queue, or open set displayed in real time
- **Path visualization** — final solution path highlighted with step count
- **g/f score overlay** — toggle cost scores on each cell during A\*
- **6 maze sizes** — from 3×3 up to 8×8
- **Zero dependencies** — single `.html` file, works offline, no install needed

---

## 🚀 Quick Start

```bash
# Just open the file in your browser
open maze-visualizer.html
```

Or double-click `maze-visualizer.html` — that's it. No server, no npm, no build step.

---

## 🧠 Algorithms

### 🌲 Generation — Depth-First Search (DFS)

Carves a perfect maze by exploring randomly and backtracking when stuck. Every cell is guaranteed to be reachable.

```
Start at (0,0)
→ Pick a random unvisited neighbor
→ Remove the wall between them
→ Move to that neighbor, push old position to stack
→ No neighbors? Pop from stack (backtrack)
→ Repeat until all cells are visited
```

**Data structure:** Stack (LIFO)

---

### 🔵 Solving — Breadth-First Search (BFS)

Explores cells level by level, guaranteeing the **shortest path** in an unweighted maze.

**Data structure:** Queue (FIFO)  
**Optimal:** ✅ Yes  
**Time complexity:** O(V + E)

---

### 🔮 Solving — A\*

Uses a **Manhattan distance heuristic** to guide search toward the exit. Typically explores fewer cells than BFS while still finding the optimal path.

**Data structure:** Priority queue (sorted by f = g + h)  
**Optimal:** ✅ Yes  
**Time complexity:** O(E log V)

---

### 📊 Solving — Dijkstra's Algorithm

Explores by lowest accumulated cost. Behaves like BFS on a uniform-cost maze, optimal and complete.

**Data structure:** Priority queue (sorted by distance)  
**Optimal:** ✅ Yes  
**Time complexity:** O(E log V)

---

## 🎮 Controls

| Control | Action |
|---|---|
| `▶ PLAY` | Auto-play through all steps |
| `⏸ PAUSE` | Pause animation |
| `NEXT ▶` | Advance one step |
| `◀ PREV` | Go back one step |
| `🔄 RESET` | Regenerate a new maze |
| Speed slider | Set delay per step (50ms – 1500ms) |
| Size buttons | Choose maze size (3×3 → 8×8) |
| Algo pills | Switch between BFS / A\* / Dijkstra |
| g/f scores toggle | Show cost values on cells (A\* only) |

---

## 🎨 Cell Color Legend

| Color | Meaning |
|---|---|
| 🟡 Yellow | Current cell being processed |
| 🟢 Teal | Path from start to exit |
| 🔵 Blue | Open set (A\* / Dijkstra candidates) |
| 🔴 Red | Closed set (already fully explored) |
| Dark teal | Visited cell |
| Dark | Unvisited cell |

---

## 📁 Project Structure

```
inedx.html
script.js
style.css
README.md
```

The visualizer is intentionally a single self-contained file. All logic, styles, and markup live together so it can be shared, run, and modified without any tooling.

The code inside is organized into clear sections:

```
CONSTANTS     → OPPOSITE, MOVES, DIRS — defined once, shared everywhere
GRID UTILS    → makeGrid(), cloneGrid()
ALGORITHMS    → buildDFSSteps(), buildBFSSteps(), buildAStarSteps(), buildDijkstraSteps()
PATH BUILDER  → buildPath() — shared by all solvers
RENDER        → renderMaze() — pure function, grid → DOM
UI             → updateUI(), syncTabs()
CONTROLS      → togglePlay(), stepForward(), stepBackward(), changeSize(), etc.
INIT          → window.onload
```

---

## 🔧 Customization

**Change default maze size** — find `let mazeSize = 5;` and update the value.

**Add a new solving algorithm** — implement `buildXxxSteps(grid, size)` returning an array of step objects with `{ type, cur, msg, path, grid }`, then add it to `buildSolveSteps()` and register a pill button.

**Change wall color** — find `.cell { border: 2.5px solid rgba(99,255,200,0.55); }` in the `<style>` block.

**Change animation default speed** — find `let speed = 300;` and update the value.

---

## 📄 License

MIT — free to use, modify, and distribute.

---

**Author:** lamliti ayoub &nbsp;·&nbsp; Made for 42 School
