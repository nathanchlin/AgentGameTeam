# Agent Game Team

A multi-game platform built with custom HTML5 Canvas game engine using Entity-Component-System (ECS) architecture. Features a unified home page with 9 Chinese ink wash painting themed games.

## Features

- Custom ECS game engine with fixed timestep game loop
- Registry-based game management system
- Unified home page with card grid navigation
- Scroll support for accessing all games
- Chinese ink wash painting (水墨画) visual theme
- Keyboard and mouse controls
- Scene-based architecture

## Games

| Game | Chinese Name | Category | Difficulty | Description |
|------|-------------|----------|------------|-------------|
| Snake | 贪吃蛇 | Arcade | Easy | Classic snake game |
| Spirit Painter | 水墨弹幕 | Action | Medium | Bullet hell shooter |
| Tetris Battle | 俄罗斯方块对战 | Puzzle | Medium | Versus Tetris with AI & skills |
| Ink Tower Defense | 墨韵塔防 | Strategy | Medium | Tower defense with 5 tower types |
| Ink Runner | 水墨跑酷 | Action | Easy | Endless runner |
| Ink Cards | 水墨卡牌 | Strategy | Medium | Turn-based card battler |
| Ink Match | 水墨消消乐 | Puzzle | Easy | Match-3 puzzle |
| Ink Breakout | 水墨弹球 | Arcade | Easy | Classic breakout |
| Ink Minesweeper | 水墨扫雷 | Puzzle | Easy | Classic minesweeper |

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

## Development Commands

```bash
npm run dev        # Start Vite dev server (localhost:3000)
npm run build      # TypeScript compile + Vite production build
npm run preview    # Preview production build
npm test           # Run Jest unit tests
npm run test:e2e   # Run Playwright E2E tests
npm run lint       # ESLint on src/
npm run format     # Prettier format src/**/*.ts
```

## Architecture

### Entity-Component-System (ECS)

```
Entity (container) -> Components (data + behavior) -> Systems (logic processors)
```

**Entity** (`src/entities/Entity.ts`):
- Stores position, dimensions, active state
- Component management: `addComponent()`, `getComponent<T>()`, `hasComponent()`, `removeComponent()`

**Component** (`src/components/Component.ts`):
- Abstract base with `update(deltaTime)` and optional `render(ctx)`
- Holds reference to parent entity

**Systems** (`src/systems/`):
- Standalone classes processing entities with specific components
- Created and managed within Scenes

### Core Engine (`src/core/`)

| Module | Description |
|--------|-------------|
| Engine | Main coordinator - canvas, game loop, input, scene management |
| GameLoop | Fixed timestep loop (prevents spiral of death) |
| Scene | Entity container with `enter()`, `exit()`, `update()`, `render()` lifecycle |
| EventBus | Pub/sub for cross-component communication |

### Data Flow

```
Input -> EventBus.emit() -> Scene.update() -> Entity.update() -> Component.update()
                                                                              |
Canvas <- Component.render() <- Entity.render() <- Scene.render() <- Engine.render()
```

## Project Structure

```
src/
├── core/           # Engine core (Engine, GameLoop, Scene, EventBus)
├── components/     # ECS components
│   ├── tetris/     # Tetris-specific components
│   ├── cardBattle/ # Card battle components
│   ├── inkRunner/  # Runner game components
│   ├── matchThree/ # Match-3 components
│   └── towerDefense/ # Tower defense components
├── systems/        # ECS systems (logic processors)
├── scenes/         # Game scenes
├── entities/       # Entity base class
├── data/           # Game configurations (tetrominoes, skills, etc.)
├── registry/       # Game registry system
└── main.ts         # Application entry point
```

## Adding a New Game

1. **Create Scene** - Extend `Scene` in `src/scenes/`:
```typescript
export class MyGameScene extends Scene {
  enter(): void { /* Initialize game */ }
  exit(): void { /* Cleanup */ }
  update(deltaTime: number): void { /* Game logic */ }
  render(ctx: CanvasRenderingContext2D): void { /* Draw game */ }
}
```

2. **Register Game** - Add to `registerGames()` in `src/main.ts`:
```typescript
registry.register(
  {
    id: 'myGame',
    name: 'My Game',
    nameZh: '我的游戏',
    description: 'Game description',
    descriptionZh: '游戏描述',
    category: 'arcade', // arcade | puzzle | action | strategy
    tags: ['casual'],
    difficulty: 'easy', // easy | medium | hard
    estimatedPlayTime: '5-10 min',
    controls: ['Arrow Keys'],
  },
  () => new MyGameScene(engine)
);
```

3. **Add Components/Systems** (optional):
   - Create in `src/components/` and `src/systems/`
   - Follow ECS pattern

## Controls

### Home Page
- Arrow Keys / WASD: Navigate game cards
- Mouse Wheel: Scroll to view more games
- Enter / Click: Select game
- Escape: Return to home

### URL Parameters
Launch specific game directly:
```
http://localhost:3000?game=tetris
```

## Tech Stack

- **Runtime**: TypeScript + Vite
- **Rendering**: HTML5 Canvas 2D
- **Architecture**: Custom ECS engine
- **Testing**: Jest (unit), Playwright (E2E)
- **Code Quality**: ESLint, Prettier

## License

MIT
