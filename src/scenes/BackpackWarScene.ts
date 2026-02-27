import { Scene } from '../core/Scene';
import type { Engine } from '../core/Engine';
import type { EventBus } from '../core/EventBus';
import { Entity } from '../entities/Entity';
import { HeroComponent } from '../components/backpackWar/HeroComponent';
import { ItemComponent } from '../components/backpackWar/ItemComponent';
import { EnemyComponent } from '../components/backpackWar/EnemyComponent';
import { BackpackSystem, AutoBattleSystem, WaveSystem } from '../systems/backpackWar';
import {
  getAllHeroConfigs,
  getItemConfig,
  getEnemyConfig,
  getRandomShopItems,
  type ItemDefinition,
} from '../data/backpackWarConfigs';

type GamePhase = 'shop' | 'battle' | 'victory' | 'defeat';

/**
 * Helper function to add rounded rectangle path (for browser compatibility)
 */
function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Main scene for Backpack War game.
 * Auto-battler with inventory management and Q-version (chibi) visual style.
 */
export class BackpackWarScene extends Scene {
  private engine: Engine;
  private eventBus: EventBus;

  // Game state
  private phase: GamePhase = 'shop';
  private wave: number = 0;
  private gold: number = 50;
  private lives: number = 10;

  // Systems
  private backpackSystem: BackpackSystem;
  private autoBattleSystem: AutoBattleSystem;
  private waveSystem: WaveSystem;

  // Entities
  private heroes: Entity[] = [];
  private enemies: Entity[] = [];
  private itemEntities: Entity[] = [];

  // Shop state
  private shopItems: ItemDefinition[] = [];
  private draggedItem: { item: ItemComponent; entity: Entity } | null = null;
  private dragOffset = { x: 0, y: 0 };

  // Mouse state
  private mousePosition = { x: 0, y: 0 };

  // Animation time
  private animationTime: number = 0;

  constructor(engine: Engine) {
    super('BackpackWar');

    this.engine = engine;
    this.eventBus = engine.getEventBus();

    // Initialize systems
    this.backpackSystem = new BackpackSystem();
    this.autoBattleSystem = new AutoBattleSystem();
    this.waveSystem = new WaveSystem(
      this.eventBus,
      this.autoBattleSystem.battleAreaLeft,
      this.autoBattleSystem.battleAreaTop,
      this.autoBattleSystem.battleAreaWidth,
      this.autoBattleSystem.battleAreaHeight
    );

    // Setup callbacks
    this.waveSystem.setCreateEnemyCallback((enemyId) => this.createEnemy(enemyId));

    // Setup event handlers
    this.setupEventHandlers();

    // Initialize heroes
    this.initializeHeroes();

    // Generate initial shop
    this.refreshShop();
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    console.log('Setting up event handlers...');
    this.eventBus.on('mousemove', (data: { x: number; y: number }) => {
      this.handleMouseMove(data.x, data.y);
    });

    this.eventBus.on('mousedown', (data: { x: number; y: number }) => {
      console.log('mousedown event received at', data.x, data.y);
      this.handleMouseDown(data.x, data.y);
    });

    this.eventBus.on('mouseup', (data: { x: number; y: number }) => {
      this.handleMouseUp(data.x, data.y);
    });

    this.eventBus.on('keydown', (data: { key: string }) => {
      this.handleKeyDown(data.key);
    });

    this.eventBus.on('wave:complete', (data: { reward: number }) => {
      this.gold += data.reward;
      this.phase = 'shop';
      this.refreshShop();
      this.autoBattleSystem.stopBattle();

      // Full heal heroes between waves
      for (const heroEntity of this.heroes) {
        const hero = heroEntity.getComponent(HeroComponent);
        if (hero) {
          hero.hp = hero.maxHp;
          hero.state = 'idle';
        }
      }
    });

    this.eventBus.on('game:all_waves_complete', () => {
      this.phase = 'victory';
      this.autoBattleSystem.stopBattle();
    });
  }

  /**
   * Initialize heroes
   */
  private initializeHeroes(): void {
    const heroConfigs = getAllHeroConfigs();

    for (const config of heroConfigs) {
      const hero = new Entity(`hero_${config.id}`, 0, 0);

      const heroComp = new HeroComponent(
        config.id,
        config.heroClass,
        config.baseStats,
        config.color,
        config.nameZh,
        config.attackRange,
        config.attackSpeed
      );

      hero.addComponent(heroComp);
      this.heroes.push(hero);
      this.addEntity(hero);
      this.autoBattleSystem.addHero(hero);
    }
  }

  /**
   * Create enemy entity
   */
  private createEnemy(enemyId: string): Entity | null {
    console.log('createEnemy called with:', enemyId);
    const config = getEnemyConfig(enemyId);
    if (!config) {
      console.log('No config found for enemy:', enemyId);
      return null;
    }

    const enemy = new Entity(`enemy_${Date.now()}_${Math.random()}`, 0, 0);

    const enemyComp = new EnemyComponent(
      enemyId,
      config.name,
      config.nameZh,
      config.hp,
      config.attack,
      config.defense,
      config.speed,
      config.reward,
      config.color,
      config.size
    );

    enemy.addComponent(enemyComp);
    this.enemies.push(enemy);
    this.addEntity(enemy);
    this.autoBattleSystem.addEnemy(enemy);
    console.log('Enemy created, total enemies:', this.enemies.length);

    return enemy;
  }

  /**
   * Refresh shop with new items
   */
  private refreshShop(): void {
    this.shopItems = getRandomShopItems(4, this.wave);
  }

  /**
   * Buy item from shop
   */
  private buyItem(itemDef: ItemDefinition): boolean {
    if (this.gold < itemDef.cost) return false;

    this.gold -= itemDef.cost;

    // Create item entity
    const itemEntity = new Entity(`item_${Date.now()}_${Math.random()}`, 0, 0);
    const itemComp = this.backpackSystem.createItemFromDefinition(itemDef);

    itemEntity.addComponent(itemComp);
    this.itemEntities.push(itemEntity);
    this.addEntity(itemEntity);
    this.backpackSystem.addItemEntity(itemEntity, itemComp);

    // Start dragging the new item
    this.draggedItem = { item: itemComp, entity: itemEntity };

    return true;
  }

  /**
   * Handle mouse movement
   */
  private handleMouseMove(x: number, y: number): void {
    this.mousePosition = { x, y };

    if (this.draggedItem) {
      // Update dragged item position for rendering
    }
  }

  /**
   * Handle mouse down
   */
  private handleMouseDown(x: number, y: number): void {
    if (this.phase === 'victory' || this.phase === 'defeat') {
      this.resetGame();
      return;
    }

    if (this.phase === 'shop') {
      // Check shop item click
      const shopY = 540;
      const itemSize = 60;
      const startX = 20;
      const spacing = 70;

      for (let i = 0; i < this.shopItems.length; i++) {
        const itemX = startX + i * spacing;
        if (x >= itemX && x <= itemX + itemSize && y >= shopY && y <= shopY + itemSize) {
          this.buyItem(this.shopItems[i]);
          return;
        }
      }

      // Check backpack grid click
      const gridPos = this.backpackSystem.screenToGrid(x, y);
      const gridItem = this.backpackSystem.getItemAt(gridPos.x, gridPos.y);

      if (gridItem) {
        this.draggedItem = gridItem;
        this.dragOffset = {
          x: x - (this.backpackSystem.gridOffsetX + gridItem.item.gridX * this.backpackSystem.cellSize),
          y: y - (this.backpackSystem.gridOffsetY + gridItem.item.gridY * this.backpackSystem.cellSize),
        };
      }

      // Check Start Battle button click
      const battleBtnX = 600;
      const battleBtnY = 540;
      const battleBtnW = 120;
      const battleBtnH = 50;

      if (x >= battleBtnX && x <= battleBtnX + battleBtnW &&
          y >= battleBtnY && y <= battleBtnY + battleBtnH) {
        this.startBattle();
        return;
      }
    }
  }

  /**
   * Handle mouse up
   */
  private handleMouseUp(x: number, y: number): void {
    if (this.phase !== 'shop') return;

    if (this.draggedItem) {
      const gridPos = this.backpackSystem.screenToGrid(x - this.dragOffset.x, y - this.dragOffset.y);

      // Try to place item
      if (this.backpackSystem.canPlaceItem(this.draggedItem.item, gridPos.x, gridPos.y, this.draggedItem.entity.id)) {
        this.backpackSystem.placeItem(this.draggedItem.item, gridPos.x, gridPos.y);
        this.backpackSystem.calculateAdjacencyBonuses(this.heroes);
      } else if (this.draggedItem.item.gridX < 0) {
        // New item that can't be placed - refund
        const itemDef = getItemConfig(this.draggedItem.item.itemId);
        if (itemDef) {
          this.gold += itemDef.cost;
        }
        // Remove item
        const idx = this.itemEntities.indexOf(this.draggedItem.entity);
        if (idx >= 0) {
          this.itemEntities.splice(idx, 1);
          this.removeEntity(this.draggedItem.entity);
        }
        this.backpackSystem.removeItemEntity(this.draggedItem.entity.id);
      }

      this.draggedItem = null;
    }
  }

  /**
   * Handle key press
   */
  private handleKeyDown(key: string): void {
    switch (key.toLowerCase()) {
      case ' ':
      case 'enter':
        if (this.phase === 'shop') {
          this.startBattle();
        }
        break;
      case 'escape':
        if (this.draggedItem) {
          // Cancel drag
          if (this.draggedItem.item.gridX < 0) {
            // Refund new item
            const itemDef = getItemConfig(this.draggedItem.item.itemId);
            if (itemDef) {
              this.gold += itemDef.cost;
            }
            const idx = this.itemEntities.indexOf(this.draggedItem.entity);
            if (idx >= 0) {
              this.itemEntities.splice(idx, 1);
              this.removeEntity(this.draggedItem.entity);
            }
            this.backpackSystem.removeItemEntity(this.draggedItem.entity.id);
          }
          this.draggedItem = null;
        }
        break;
      case 'r':
        if (this.phase === 'victory' || this.phase === 'defeat') {
          this.resetGame();
        }
        break;
    }
  }

  /**
   * Start battle phase
   */
  private startBattle(): void {
    console.log('startBattle called');
    this.phase = 'battle';
    this.wave++;

    // Position heroes in battle area
    const startY = 150;
    const spacing = 100;
    for (let i = 0; i < this.heroes.length; i++) {
      const hero = this.heroes[i];
      const heroComp = hero.getComponent(HeroComponent);
      if (heroComp) {
        hero.x = this.autoBattleSystem.battleAreaLeft + 80;
        hero.y = startY + i * spacing;
        heroComp.battleX = hero.x;
        heroComp.battleY = hero.y;
        console.log(`Hero ${i} positioned at (${hero.x}, ${hero.y})`);
      }
    }

    // Clear old enemies
    this.enemies = [];
    this.autoBattleSystem.clear();
    for (const hero of this.heroes) {
      this.autoBattleSystem.addHero(hero);
    }

    // Start wave
    console.log('Starting wave...');
    const waveStarted = this.waveSystem.startNextWave();
    console.log('Wave started:', waveStarted);
    this.autoBattleSystem.startBattle();
    console.log('Battle started');
  }

  /**
   * Reset game
   */
  private resetGame(): void {
    this.phase = 'shop';
    this.wave = 0;
    this.gold = 50;
    this.lives = 10;

    this.waveSystem.reset();
    this.autoBattleSystem.clear();
    this.backpackSystem.clear();

    // Clear items
    for (const item of this.itemEntities) {
      this.removeEntity(item);
    }
    this.itemEntities = [];

    // Clear enemies
    for (const enemy of this.enemies) {
      this.removeEntity(enemy);
    }
    this.enemies = [];

    // Reset heroes
    for (const heroEntity of this.heroes) {
      const hero = heroEntity.getComponent(HeroComponent);
      if (hero) {
        hero.resetToBase();
        hero.state = 'idle';
      }
    }

    this.refreshShop();
  }

  /**
   * Scene enter handler
   */
  enter(): void {
    console.log('BackpackWarScene enter() called');
    super.enter();
    this.resetGame();
    console.log('Game reset, phase:', this.phase);
  }

  /**
   * Scene exit handler
   */
  exit(): void {
    super.exit();
    this.resetGame();
  }

  /**
   * Main update loop
   */
  update(deltaTime: number): void {
    this.animationTime += deltaTime;

    if (this.phase === 'battle') {
      console.log('Scene update: battle phase, enemies:', this.enemies.length);
      this.waveSystem.update(deltaTime);
      this.autoBattleSystem.update(deltaTime);

      // Remove dead enemies
      this.enemies = this.enemies.filter(enemy => {
        const enemyComp = enemy.getComponent(EnemyComponent);
        if (enemyComp && enemyComp.state === 'dead') {
          this.removeEntity(enemy);
          return false;
        }
        return true;
      });

      // Check defeat
      if (this.autoBattleSystem.isDefeat()) {
        this.lives--;
        if (this.lives <= 0) {
          this.phase = 'defeat';
        } else {
          // Can continue, lose 1 life
          this.phase = 'shop';
          this.waveSystem.reset();
          this.autoBattleSystem.stopBattle();

          // Full heal heroes
          for (const heroEntity of this.heroes) {
            const hero = heroEntity.getComponent(HeroComponent);
            if (hero) {
              hero.hp = hero.maxHp;
              hero.state = 'idle';
            }
          }
        }
      }

      // Check wave complete
      if (this.waveSystem.isWaveComplete(this.enemies.length)) {
        this.waveSystem.onWaveComplete();
      }
    }

    super.update(deltaTime);
  }

  /**
   * Main render loop
   */
  render(ctx: CanvasRenderingContext2D): void {
    // Background
    this.drawBackground(ctx);

    // Draw based on phase
    this.drawBackpack(ctx);
    this.drawBattleArea(ctx);

    if (this.phase === 'shop') {
      this.drawShop(ctx);
    }

    if (this.phase === 'battle') {
      this.drawBattle(ctx);
    }

    // Draw dragged item
    if (this.draggedItem) {
      this.drawDraggedItem(ctx);
    }

    // Draw UI
    this.drawUI(ctx);

    // Draw overlays
    if (this.phase === 'victory' || this.phase === 'defeat') {
      this.drawEndOverlay(ctx);
    }
  }

  /**
   * Draw background
   */
  private drawBackground(ctx: CanvasRenderingContext2D): void {
    // Soft gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, this.engine.height);
    gradient.addColorStop(0, '#E8F5E9');
    gradient.addColorStop(1, '#C8E6C9');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.engine.width, this.engine.height);

    // Decorative circles
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = '#4CAF50';
      ctx.beginPath();
      ctx.arc(
        100 + i * 200,
        100 + Math.sin(this.animationTime / 1000 + i) * 20,
        40 + Math.sin(this.animationTime / 500 + i * 2) * 10,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /**
   * Draw backpack grid
   */
  private drawBackpack(ctx: CanvasRenderingContext2D): void {
    const { gridOffsetX, gridOffsetY, gridWidth, gridHeight, cellSize } = this.backpackSystem;

    // Backpack panel background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 3;
    ctx.beginPath();
    roundedRect(ctx, gridOffsetX - 10, gridOffsetY - 40, gridWidth * cellSize + 20, gridHeight * cellSize + 60, 10);
    ctx.fill();
    ctx.stroke();

    // Title
    ctx.fillStyle = '#2E7D32';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎒 背包', gridOffsetX + (gridWidth * cellSize) / 2, gridOffsetY - 15);

    // Draw hero indicators on left side
    const heroNames = ['战士', '法师', '弓手', '牧师'];
    const heroColors = ['#CD5C5C', '#9370DB', '#3CB371', '#FFB6C1'];
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = heroColors[i];
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(heroNames[i], gridOffsetX - 15, gridOffsetY + 25 + i * cellSize);
    }

    // Draw grid
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const cellX = gridOffsetX + x * cellSize;
        const cellY = gridOffsetY + y * cellSize;

        // Cell background
        ctx.fillStyle = '#F5F5F5';
        ctx.strokeStyle = '#BDBDBD';
        ctx.lineWidth = 1;
        ctx.fillRect(cellX, cellY, cellSize, cellSize);
        ctx.strokeRect(cellX, cellY, cellSize, cellSize);
      }
    }

    // Draw items in backpack
    for (const { item } of this.backpackSystem.getAllItems()) {
      if (item.gridX < 0 || this.draggedItem?.item === item) continue;
      this.drawItemInGrid(ctx, item);
    }
  }

  /**
   * Draw item in grid
   */
  private drawItemInGrid(ctx: CanvasRenderingContext2D, item: ItemComponent): void {
    const { gridOffsetX, gridOffsetY, cellSize } = this.backpackSystem;
    const x = gridOffsetX + item.gridX * cellSize;
    const y = gridOffsetY + item.gridY * cellSize;
    const width = item.gridWidth * cellSize - 4;
    const height = item.gridHeight * cellSize - 4;

    // Item background with rarity color
    const rarityColors: Record<string, string> = {
      common: '#9E9E9E',
      rare: '#2196F3',
      epic: '#9C27B0',
      legendary: '#FF9800',
    };

    ctx.fillStyle = item.color;
    ctx.strokeStyle = rarityColors[item.rarity];
    ctx.lineWidth = 2;
    ctx.beginPath();
    roundedRect(ctx, x + 2, y + 2, width, height, 5);
    ctx.fill();
    ctx.stroke();

    // Item icon/type indicator
    ctx.fillStyle = '#FFF';
    ctx.font = `${Math.min(width, height) * 0.4}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const icons: Record<string, string> = {
      weapon: '⚔️',
      armor: '🛡️',
      consumable: '🧪',
      gem: '💎',
    };
    ctx.fillText(icons[item.type] || '?', x + width / 2 + 2, y + height / 2 + 2);
  }

  /**
   * Draw dragged item
   */
  private drawDraggedItem(ctx: CanvasRenderingContext2D): void {
    if (!this.draggedItem) return;

    const item = this.draggedItem.item;
    const width = item.gridWidth * this.backpackSystem.cellSize - 4;
    const height = item.gridHeight * this.backpackSystem.cellSize - 4;

    ctx.globalAlpha = 0.8;

    const rarityColors: Record<string, string> = {
      common: '#9E9E9E',
      rare: '#2196F3',
      epic: '#9C27B0',
      legendary: '#FF9800',
    };

    ctx.fillStyle = item.color;
    ctx.strokeStyle = rarityColors[item.rarity];
    ctx.lineWidth = 3;
    roundedRect(
      ctx,
      this.mousePosition.x - width / 2,
      this.mousePosition.y - height / 2,
      width,
      height,
      5
    );
    ctx.fill();
    ctx.stroke();

    const icons: Record<string, string> = {
      weapon: '⚔️',
      armor: '🛡️',
      consumable: '🧪',
      gem: '💎',
    };
    ctx.fillStyle = '#FFF';
    ctx.font = `${Math.min(width, height) * 0.4}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      icons[item.type] || '?',
      this.mousePosition.x,
      this.mousePosition.y
    );

    ctx.globalAlpha = 1;
  }

  /**
   * Draw battle area
   */
  private drawBattleArea(ctx: CanvasRenderingContext2D): void {
    const { battleAreaLeft, battleAreaTop, battleAreaWidth, battleAreaHeight } = this.autoBattleSystem;

    // Battle arena background
    ctx.fillStyle = 'rgba(255, 248, 225, 0.8)';
    ctx.strokeStyle = '#FFB300';
    ctx.lineWidth = 3;
    ctx.beginPath();
    roundedRect(ctx, battleAreaLeft, battleAreaTop, battleAreaWidth, battleAreaHeight, 10);
    ctx.fill();
    ctx.stroke();

    // Arena title
    ctx.fillStyle = '#F57C00';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚔️ 战斗区域 ⚔️', battleAreaLeft + battleAreaWidth / 2, battleAreaTop - 10);
  }

  /**
   * Draw shop
   */
  private drawShop(ctx: CanvasRenderingContext2D): void {
    const shopY = 540;
    const itemSize = 60;
    const startX = 20;
    const spacing = 70;

    // Shop panel
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = '#FF9800';
    ctx.lineWidth = 2;
    ctx.beginPath();
    roundedRect(ctx, startX - 10, shopY - 30, this.shopItems.length * spacing + 20, 100, 10);
    ctx.fill();
    ctx.stroke();

    // Title
    ctx.fillStyle = '#E65100';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🏪 商店', startX, shopY - 10);

    // Draw shop items
    for (let i = 0; i < this.shopItems.length; i++) {
      const item = this.shopItems[i];
      const x = startX + i * spacing;
      const y = shopY;

      const canAfford = this.gold >= item.cost;

      // Item background
      const rarityColors: Record<string, string> = {
        common: '#9E9E9E',
        rare: '#2196F3',
        epic: '#9C27B0',
        legendary: '#FF9800',
      };

      ctx.globalAlpha = canAfford ? 1 : 0.5;
      ctx.fillStyle = item.color;
      ctx.strokeStyle = rarityColors[item.rarity];
      ctx.lineWidth = 2;
      ctx.beginPath();
      roundedRect(ctx, x, y, itemSize, itemSize, 5);
      ctx.fill();
      ctx.stroke();

      // Item icon
      const icons: Record<string, string> = {
        weapon: '⚔️',
        armor: '🛡️',
        consumable: '🧪',
        gem: '💎',
      };
      ctx.fillStyle = '#FFF';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icons[item.type] || '?', x + itemSize / 2, y + itemSize / 2);

      // Cost
      ctx.fillStyle = canAfford ? '#4CAF50' : '#F44336';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`${item.cost}💰`, x + itemSize / 2, y + itemSize + 12);

      ctx.globalAlpha = 1;
    }

    // Start battle button
    const battleBtnX = 600;
    const battleBtnY = shopY;
    const battleBtnW = 120;
    const battleBtnH = 50;

    ctx.fillStyle = '#4CAF50';
    ctx.strokeStyle = '#2E7D32';
    ctx.lineWidth = 3;
    ctx.beginPath();
    roundedRect(ctx, battleBtnX, battleBtnY, battleBtnW, battleBtnH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('开始战斗!', battleBtnX + battleBtnW / 2, battleBtnY + battleBtnH / 2 - 8);
    ctx.font = '12px sans-serif';
    ctx.fillText('[空格]', battleBtnX + battleBtnW / 2, battleBtnY + battleBtnH / 2 + 10);
  }

  /**
   * Draw battle (heroes and enemies)
   */
  private drawBattle(ctx: CanvasRenderingContext2D): void {
    // Draw heroes
    for (const heroEntity of this.heroes) {
      const hero = heroEntity.getComponent(HeroComponent);
      if (!hero) continue;

      this.drawChibiCharacter(ctx, heroEntity.x, heroEntity.y, hero.color, hero.state, hero.bounceOffset);

      // Draw HP bar
      this.drawHealthBar(ctx, heroEntity.x, heroEntity.y - 45, 40, hero.hp, hero.maxHp, '#4CAF50');

      // Draw class indicator
      ctx.fillStyle = '#FFF';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(hero.nameZh, heroEntity.x, heroEntity.y + 40);
    }

    // Draw enemies
    for (const enemyEntity of this.enemies) {
      const enemy = enemyEntity.getComponent(EnemyComponent);
      if (!enemy || enemy.state === 'dead') continue;

      this.drawEnemy(ctx, enemyEntity.x, enemyEntity.y, enemy.color, enemy.size, enemy.bounceOffset);

      // Draw HP bar
      this.drawHealthBar(ctx, enemyEntity.x, enemyEntity.y - enemy.size - 10, enemy.size, enemy.hp, enemy.maxHp, '#F44336');
    }

    // Draw damage numbers
    for (const dn of this.autoBattleSystem.getDamageNumbers()) {
      const alpha = dn.lifetime / dn.maxLifetime;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = dn.isCrit ? '#FF9800' : '#F44336';
      ctx.font = dn.isCrit ? 'bold 18px sans-serif' : '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${dn.damage}${dn.isCrit ? '!' : ''}`, dn.x, dn.y);
      ctx.globalAlpha = 1;
    }
  }

  /**
   * Draw Q-version (chibi) character
   */
  private drawChibiCharacter(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    state: string,
    bounceOffset: number
  ): void {
    ctx.save();
    ctx.translate(x, y + bounceOffset);

    // Attack animation
    if (state === 'attacking') {
      ctx.translate(5, 0);
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 30, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body (small oval)
    ctx.fillStyle = color;
    ctx.strokeStyle = shadeColor(color, -20);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 15, 18, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Head (big circle - Q-style)
    ctx.fillStyle = '#FFE0B2';
    ctx.strokeStyle = '#BCAAA4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -15, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Hair/Head decoration based on color
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -35, 15, Math.PI, Math.PI * 2);
    ctx.fill();

    // Eyes (big and cute)
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.ellipse(-8, -18, 8, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(8, -18, 8, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(-6, -16, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(10, -16, 4, 0, Math.PI * 2);
    ctx.fill();

    // Eye highlights
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(-4, -18, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(12, -18, 2, 0, Math.PI * 2);
    ctx.fill();

    // Cute mouth
    ctx.strokeStyle = '#E91E63';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -5, 6, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Blush
    ctx.fillStyle = 'rgba(255, 138, 128, 0.4)';
    ctx.beginPath();
    ctx.ellipse(-18, -8, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(18, -8, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Arms (simple circles)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(-20, 10, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(20, 10, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Draw enemy (Q-style)
   */
  private drawEnemy(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    size: number,
    bounceOffset: number
  ): void {
    ctx.save();
    ctx.translate(x, y + bounceOffset);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(0, size / 2 + 5, size / 2, size / 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = color;
    ctx.strokeStyle = shadeColor(color, -30);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Angry eyes
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.ellipse(-size / 5, -size / 8, size / 6, size / 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(size / 5, -size / 8, size / 6, size / 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupils (angry look)
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(-size / 5, -size / 8 + 2, size / 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(size / 5, -size / 8 + 2, size / 10, 0, Math.PI * 2);
    ctx.fill();

    // Angry eyebrows
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-size / 2.5, -size / 3);
    ctx.lineTo(-size / 8, -size / 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(size / 2.5, -size / 3);
    ctx.lineTo(size / 8, -size / 4);
    ctx.stroke();

    // Fangs
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.moveTo(-size / 6, size / 6);
    ctx.lineTo(-size / 10, size / 3);
    ctx.lineTo(0, size / 6);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(size / 6, size / 6);
    ctx.lineTo(size / 10, size / 3);
    ctx.lineTo(0, size / 6);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Draw health bar
   */
  private drawHealthBar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    current: number,
    max: number,
    color: string
  ): void {
    const height = 6;
    const percent = Math.max(0, current / max);

    // Background
    ctx.fillStyle = '#333';
    ctx.fillRect(x - width / 2, y, width, height);

    // Health
    ctx.fillStyle = color;
    ctx.fillRect(x - width / 2 + 1, y + 1, (width - 2) * percent, height - 2);

    // Border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - width / 2, y, width, height);
  }

  /**
   * Draw UI elements
   */
  private drawUI(ctx: CanvasRenderingContext2D): void {
    // Top bar
    ctx.fillStyle = 'rgba(62, 39, 35, 0.9)';
    ctx.fillRect(0, 0, this.engine.width, 60);

    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Gold
    ctx.fillText(`💰 ${this.gold}`, 20, 30);

    // Lives
    ctx.fillStyle = '#F44336';
    ctx.fillText(`❤️ ${this.lives}`, 130, 30);

    // Wave
    ctx.fillStyle = '#FFF';
    ctx.fillText(`🌊 波次 ${this.wave}/${this.waveSystem.getTotalWaves()}`, 230, 30);

    // Phase indicator
    const phaseText = {
      shop: '🛒 购物阶段',
      battle: '⚔️ 战斗中...',
      victory: '🎉 胜利!',
      defeat: '💀 失败...',
    };
    ctx.textAlign = 'right';
    ctx.fillText(phaseText[this.phase], this.engine.width - 20, 30);

    // Back button hint
    ctx.fillStyle = '#BDBDBD';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ESC: 返回主菜单', 10, this.engine.height - 10);
  }

  /**
   * Draw end game overlay
   */
  private drawEndOverlay(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.engine.width, this.engine.height);

    const isVictory = this.phase === 'victory';

    ctx.fillStyle = isVictory ? '#4CAF50' : '#F44336';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isVictory ? '🎉 胜利! 🎉' : '💀 失败 💀', this.engine.width / 2, this.engine.height / 2 - 40);

    ctx.fillStyle = '#FFF';
    ctx.font = '24px sans-serif';
    ctx.fillText(`完成波次: ${this.wave}`, this.engine.width / 2, this.engine.height / 2 + 20);

    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#BDBDBD';
    ctx.fillText('点击或按 R 重新开始', this.engine.width / 2, this.engine.height / 2 + 70);
    ctx.fillText('按 ESC 返回主菜单', this.engine.width / 2, this.engine.height / 2 + 100);
  }
}

/**
 * Helper function to shade a color
 */
function shadeColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return (
    '#' +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}
