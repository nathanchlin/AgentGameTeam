import { Component } from '../Component';
import type { ItemEffect, ItemType, Rarity } from '../../data/backpackWarConfigs';

/**
 * Component for items in Backpack War.
 * Stores item data and grid position.
 */
export class ItemComponent extends Component {
  itemId: string;
  itemName: string;
  itemNameZh: string;
  type: ItemType;
  rarity: Rarity;
  effects: ItemEffect[];
  color: string;
  cost: number;

  // Grid position in backpack
  gridX: number = -1;
  gridY: number = -1;
  gridWidth: number;
  gridHeight: number;

  // Is this item currently being dragged?
  isDragging: boolean = false;

  constructor(
    itemId: string,
    itemName: string,
    itemNameZh: string,
    type: ItemType,
    rarity: Rarity,
    effects: ItemEffect[],
    color: string,
    cost: number,
    size: { width: number; height: number }
  ) {
    super();
    this.itemId = itemId;
    this.itemName = itemName;
    this.itemNameZh = itemNameZh;
    this.type = type;
    this.rarity = rarity;
    this.effects = effects;
    this.color = color;
    this.cost = cost;
    this.gridWidth = size.width;
    this.gridHeight = size.height;
  }

  /**
   * Set grid position
   */
  setGridPosition(x: number, y: number): void {
    this.gridX = x;
    this.gridY = y;
  }

  /**
   * Check if position is valid in grid
   */
  isValidPosition(x: number, y: number, gridWidth: number, gridHeight: number): boolean {
    return x >= 0 && y >= 0 && x + this.gridWidth <= gridWidth && y + this.gridHeight <= gridHeight;
  }

  /**
   * Get all grid cells occupied by this item
   */
  getOccupiedCells(): { x: number; y: number }[] {
    const cells: { x: number; y: number }[] = [];
    for (let dy = 0; dy < this.gridHeight; dy++) {
      for (let dx = 0; dx < this.gridWidth; dx++) {
        cells.push({ x: this.gridX + dx, y: this.gridY + dy });
      }
    }
    return cells;
  }

  update(_deltaTime: number): void {
    // Items don't need update logic
  }
}
