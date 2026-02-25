# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev        # Start Vite dev server (localhost:3000)
npm run build      # TypeScript compile + Vite production build
npm run preview    # Preview production build
npm test           # Run Jest unit tests
npm run test:e2e   # Run Playwright E2E tests
npm run lint       # ESLint on src/
npm run format     # Prettier format src/**/*.ts
```

## Architecture: Entity-Component-System (ECS)

This is a custom HTML5 Canvas game engine using ECS architecture for multi-agent collaborative game development.

### Core Engine (`src/core/`)
- **Engine**: Main coordinator - initializes canvas, game loop, input handlers, scene management
- **GameLoop**: Fixed timestep loop (prevents spiral of death, separate update/render phases)
- **Scene**: Entity container with `enter()`, `exit()`, `update()`, `render()` lifecycle
- **EventBus**: Pub/sub for cross-component communication (`on`, `emit`, `once`)

### ECS Pattern
```
Entity (container) → Components (data + behavior) → Systems (logic processors)
```

**Entity** (`src/entities/Entity.ts`):
- Stores position, dimensions, active state
- `addComponent()`, `getComponent<T>()`, `hasComponent()`, `removeComponent()`
- Components keyed by constructor name

**Component** (`src/components/Component.ts`):
- Abstract base with `update(deltaTime)` and optional `render(ctx)`
- Holds reference to parent entity via `setEntity()`

**Systems** (`src/systems/`):
- Standalone classes that process entities with specific components
- Created and managed within Scenes

### Data Flow
```
Input → EventBus.emit() → Scene.update() → Entity.update() → Component.update()
                                                                          ↓
Canvas ← Component.render() ← Entity.render() ← Scene.render() ← Engine.render()
```

### Adding Game Features

1. **New Component**: Extend `Component`, implement `update()`, optionally `render()`
2. **New System**: Create class with `update(deltaTime)` method, query entities for components
3. **New Scene**: Extend `Scene`, implement lifecycle methods, create entities and systems

### Multi-Agent Development

This project supports parallel development using agent teams defined in `.claude/teams/game-dev-team.json`:
- **team-lead**: Coordination, task management
- **game-designer**: GDD, mechanics, levels
- **frontend-dev**: Rendering, UI, Canvas
- **logic-dev**: ECS systems, physics, AI
- **asset-creator**: SVG/JSON assets
- **tester**: Jest/Playwright tests

Use `TeamCreate` to spawn teams and `Task` tool to parallelize work across agents.

### Current Implementation: Snake Game

Reference implementation in `src/scenes/GameScene.ts` demonstrates:
- Entity creation with multiple components
- System setup (Input, Movement, Collision, Render, FoodSpawn)
- Event-driven game over/restart flow
- Score tracking via dedicated entity
