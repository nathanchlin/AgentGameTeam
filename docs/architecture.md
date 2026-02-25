# Architecture Document

## 1. System Overview

This project uses a custom game engine built with TypeScript and HTML5 Canvas.

```
┌─────────────────────────────────────────────────────┐
│                    Game Engine                      │
├─────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Engine  │  │GameLoop  │  │    EventBus      │  │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
│       │             │                  │            │
│  ┌────▼─────────────▼──────────────────▼─────────┐ │
│  │                 Scene Manager                  │ │
│  └───────────────────────┬───────────────────────┘ │
│                          │                         │
├──────────────────────────┼─────────────────────────┤
│  ┌───────────────────────▼───────────────────────┐ │
│  │              Entity-Component-System          │ │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────┐  │ │
│  │  │ Entities │  │Components│  │  Systems   │  │ │
│  │  └──────────┘  └──────────┘  └────────────┘  │ │
│  └───────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Rendering  │  │   Input  │  │  AssetLoader  │  │
│  └─────────────┘  └──────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────┘
```

## 2. Module Structure

### 2.1 Core Module (`src/core/`)
- **Engine.ts**: Main entry point, coordinates all systems
- **GameLoop.ts**: Fixed timestep game loop implementation
- **Scene.ts**: Scene container and management
- **EventBus.ts**: Pub/sub event system

### 2.2 Entity System (`src/entities/`)
- **Entity.ts**: Base entity class with component management

### 2.3 Component System (`src/components/`)
- **Component.ts**: Abstract base component class
- Future: PositionComponent, SpriteComponent, PhysicsComponent, etc.

### 2.4 Systems (`src/systems/`)
- Future: RenderSystem, PhysicsSystem, InputSystem, etc.

### 2.5 Scenes (`src/scenes/`)
- Scene implementations (MainMenu, GameScene, etc.)

### 2.6 UI (`src/ui/`)
- UI components and overlays

### 2.7 Utils (`src/utils/`)
- Helper functions and utilities

### 2.8 Assets (`src/assets/`)
- Static assets (SVG, JSON configs, etc.)

## 3. Design Patterns

### 3.1 Entity-Component-System (ECS)

The engine follows ECS architecture:

```typescript
// Entity: Container for components
const player = new Entity('Player', 100, 100);
player.addComponent(new SpriteComponent('player.svg'));
player.addComponent(new PhysicsComponent());

// Component: Data and behavior
class SpriteComponent extends Component {
  constructor(private spritePath: string) { super(); }

  render(ctx: CanvasRenderingContext2D) {
    // Render sprite
  }
}

// System: Processes entities with specific components
class RenderSystem {
  update(entities: Entity[]) {
    entities.forEach(e => {
      const sprite = e.getComponent(SpriteComponent);
      if (sprite) sprite.render(ctx);
    });
  }
}
```

### 3.2 Event-Driven Architecture

Components communicate via EventBus:

```typescript
// Subscribe to events
eventBus.on('collision', (data) => {
  // Handle collision
});

// Emit events
eventBus.emit('collision', { entity1, entity2 });
```

### 3.3 Scene Management

Scenes manage entity lifecycle:

```typescript
class GameScene extends Scene {
  enter() {
    // Initialize entities
  }

  exit() {
    // Cleanup
  }
}
```

## 4. Data Flow

```
User Input
    │
    ▼
EventBus (keydown/click events)
    │
    ▼
Scene.update(deltaTime)
    │
    ▼
Entity.update(deltaTime)
    │
    ▼
Component.update(deltaTime)
    │
    ▼
Engine.render()
    │
    ▼
Scene.render(ctx)
    │
    ▼
Entity.render(ctx)
    │
    ▼
Component.render(ctx)
    │
    ▼
Canvas
```

## 5. Performance Considerations

### 5.1 Rendering
- Use requestAnimationFrame for smooth animations
- Implement dirty rectangles for partial updates
- Cache rendered content where possible

### 5.2 Game Loop
- Fixed timestep for consistent physics
- Separate update and render cycles
- Frame skipping to prevent spiral of death

### 5.3 Memory Management
- Object pooling for frequently created entities
- Efficient data structures for entity queries
- Lazy loading of assets

## 6. Extension Points

### Adding New Components
1. Extend Component class
2. Implement update() and optionally render()
3. Add to entities as needed

### Adding New Systems
1. Create system class with update method
2. Register with Scene or Engine
3. Query entities with required components

### Adding New Scenes
1. Extend Scene class
2. Implement enter(), exit(), update(), render()
3. Register with Engine and switch to it

## 7. Testing Strategy

- Unit tests for utilities and pure functions
- Integration tests for ECS interactions
- E2E tests with Playwright for full game flows
