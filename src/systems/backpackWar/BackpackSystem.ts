import type { Entity } from '../../entities/Entity';
import { ItemComponent } from '../../components/backpackWar/ItemComponent';
import { HeroComponent } from '../../components/backpackWar/HeroComponent';
import type { ItemDefinition } from '../../data/backpackWarConfigs';

/**
 * System for managing the backpack inventory grid.
 * Handles item placement, drag/drop, and adjacency bonuses.
 */
export class BackpackSystem {
  // Grid settings
  readonly gridWidth = 6;
  readonly gridHeight = 4;
  readonly cellSize = 50;
  readonly gridOffsetX = 20;
  readonly gridOffsetY = 80;

  // Grid state - stores item IDs at each position
  private grid: (string | null)[][] = [];

  // Items in backpack
  private items: Map<string, { item: ItemComponent; entity: Entity }> = new Map();

  // Hero positions in grid (which hero owns which grid area)
  // Heroes 1-4 each get a column area: columns 0-1, 2-3, 4-5 for backpack
  // But actually, heroes are assigned by item adjacency to hero slots

  constructor() {
    this.initializeGrid();
  }

  /**
   * Initialize empty grid
   */
  private initializeGrid(): void {
    this.grid = [];
    for (let y = 0; y < this.gridHeight; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.gridWidth; x++) {
        this.grid[y][x] = null;
      }
    }
  }

  /**
   * Clear the grid
   */
  clear(): void {
    this.initializeGrid();
    this.items.clear();
  }

  /**
   * Add item entity to the system
   */
  addItemEntity(entity: Entity, itemComponent: ItemComponent): void {
    this.items.set(entity.id, { item: itemComponent, entity });
  }

  /**
   * Remove item from system
   */
  removeItemEntity(entityId: string): void {
    const entry = this.items.get(entityId);
    if (entry) {
      // Clear grid cells
      this.clearItemFromGrid(entry.item);
      this.items.delete(entityId);
    }
  }

  /**
   * Clear item from grid cells
   */
  private clearItemFromGrid(item: ItemComponent): void {
    if (item.gridX < 0 || item.gridY < 0) return;

    for (let dy = 0; dy < item.gridHeight; dy++) {
      for (let dx = 0; dx < item.gridWidth; dx++) {
        const x = item.gridX + dx;
        const y = item.gridY + dy;
        if (x < this.gridWidth && y < this.gridHeight) {
          this.grid[y][x] = null;
        }
      }
    }
  }

  /**
   * Check if item can be placed at position
   */
  canPlaceItem(item: ItemComponent, gridX: number, gridY: number, excludeId?: string): boolean {
    // Check bounds
    if (gridX < 0 || gridY < 0) return false;
    if (gridX + item.gridWidth > this.gridWidth) return false;
    if (gridY + item.gridHeight > this.gridHeight) return false;

    // Check if cells are free
    for (let dy = 0; dy < item.gridHeight; dy++) {
      for (let dx = 0; dx < item.gridWidth; dx++) {
        const x = gridX + dx;
        const y = gridY + dy;
        const cellContent = this.grid[y][x];
        if (cellContent !== null && cellContent !== excludeId) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Place item in grid
   */
  placeItem(item: ItemComponent, gridX: number, gridY: number): boolean {
    if (!this.canPlaceItem(item, gridX, gridY, item.gridX >= 0 ? this.items.entries().next().value?.[0] : undefined)) {
      return false;
    }

    // Remove from old position if exists
    if (item.gridX >= 0 && item.gridY >= 0) {
      this.clearItemFromGrid(item);
    }

    // Place in new position
    item.setGridPosition(gridX, gridY);

    // Find the entity ID for this item
    let entityId: string | null = null;
    for (const [id, entry] of this.items) {
      if (entry.item === item) {
        entityId = id;
        break;
      }
    }

    for (let dy = 0; dy < item.gridHeight; dy++) {
      for (let dx = 0; dx < item.gridWidth; dx++) {
        const x = gridX + dx;
        const y = gridY + dy;
        this.grid[y][x] = entityId;
      }
    }

    return true;
  }

  /**
   * Get item at grid position
   */
  getItemAt(gridX: number, gridY: number): { item: ItemComponent; entity: Entity } | null {
    if (gridX < 0 || gridY < 0 || gridX >= this.gridWidth || gridY >= this.gridHeight) {
      return null;
    }

    const entityId = this.grid[gridY][gridX];
    if (!entityId) return null;

    return this.items.get(entityId) || null;
  }

  /**
   * Convert screen position to grid position
   */
  screenToGrid(screenX: number, screenY: number): { x: number; y: number } {
    const gridX = Math.floor((screenX - this.gridOffsetX) / this.cellSize);
    const gridY = Math.floor((screenY - this.gridOffsetY) / this.cellSize);
    return { x: gridX, y: gridY };
  }

  /**
   * Convert grid position to screen position
   */
  gridToScreen(gridX: number, gridY: number): { x: number; y: number } {
    return {
      x: this.gridOffsetX + gridX * this.cellSize,
      y: this.gridOffsetY + gridY * this.cellSize,
    };
  }

  /**
   * Get all adjacent cells to a position
   */
  getAdjacentCells(gridX: number, gridY: number): { x: number; y: number }[] {
    const adjacent: { x: number; y: number }[] = [];
    const directions = [
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
    ];

    for (const dir of directions) {
      const x = gridX + dir.dx;
      const y = gridY + dir.dy;
      if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
        adjacent.push({ x, y });
      }
    }

    return adjacent;
  }

  /**
   * Calculate adjacency bonuses for gems
   * Gems give +50% bonus to adjacent items of same type
   */
  calculateAdjacencyBonuses(heroes: Entity[]): void {
    // First, reset all hero stats to base
    for (const heroEntity of heroes) {
      const hero = heroEntity.getComponent(HeroComponent);
      if (hero) {
        hero.resetToBase();
      }
    }

    // Apply item effects based on grid position
    // Column 0-1: Hero 0 (Warrior)
    // Column 2-3: Hero 1 (Mage)
    // Column 4-5: Hero 2 (Archer)
    // Plus we have 4 heroes but only 6 columns, so we need a different approach

    // Alternative: Heroes are assigned to rows
    // Row 0: Hero 0 (Warrior)
    // Row 1: Hero 1 (Mage)
    // Row 2: Hero 2 (Archer)
    // Row 3: Hero 3 (Healer)

    for (const [_id, entry] of this.items) {
      const { item } = entry;

      if (item.gridX < 0 || item.gridY < 0) continue;

      // Determine which hero this item belongs to based on row
      const heroIndex = Math.min(item.gridY, heroes.length - 1);
      const heroEntity = heroes[heroIndex];
      if (!heroEntity) continue;

      const hero = heroEntity.getComponent(HeroComponent);
      if (!hero) continue;

      // Apply base effects
      hero.applyEffects(item.effects);

      // Check for adjacent gems (bonus effects)
      const bonusMultiplier = this.calculateGemBonus(item);
      if (bonusMultiplier > 0) {
        const bonusEffects = item.effects.map(e => ({
          ...e,
          value: Math.floor(e.value * bonusMultiplier),
        }));
        hero.applyEffects(bonusEffects);
      }
    }
  }

  /**
   * Calculate gem bonus for an item
   */
  private calculateGemBonus(item: ItemComponent): number {
    if (item.type === 'gem') return 0; // Gems don't get bonuses

    let bonus = 0;
    const adjacentCells = this.getAdjacentCells(item.gridX, item.gridY);
    adjacentCells.push(...this.getAdjacentCells(item.gridX + item.gridWidth - 1, item.gridY));
    adjacentCells.push(...this.getAdjacentCells(item.gridX, item.gridY + item.gridHeight - 1));
    adjacentCells.push(...this.getAdjacentCells(item.gridX + item.gridWidth - 1, item.gridY + item.gridHeight - 1));

    // Check for adjacent gems
    const checkedCells = new Set<string>();
    for (const cell of adjacentCells) {
      const key = `${cell.x},${cell.y}`;
      if (checkedCells.has(key)) continue;
      checkedCells.add(key);

      const adjacentItem = this.getItemAt(cell.x, cell.y);
      if (adjacentItem && adjacentItem.item.type === 'gem') {
        bonus += 0.25; // 25% bonus per adjacent gem
      }
    }

    return Math.min(bonus, 1.0); // Cap at 100% bonus
  }

  /**
   * Get all items in backpack
   */
  getAllItems(): { item: ItemComponent; entity: Entity }[] {
    return Array.from(this.items.values());
  }

  /**
   * Create item from definition
   */
  createItemFromDefinition(def: ItemDefinition): ItemComponent {
    return new ItemComponent(
      def.id,
      def.name,
      def.nameZh,
      def.type,
      def.rarity,
      [...def.effects],
      def.color,
      def.cost,
      { width: def.size.width, height: def.size.height }
    );
  }

  update(_deltaTime: number): void {
    // Backpack doesn't need per-frame updates
  }
}
