import type { Engine } from '../core/Engine';
import type { Scene } from '../core/Scene';

/**
 * Game metadata for display in the home page
 */
export interface GameMeta {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  category: 'arcade' | 'puzzle' | 'action' | 'strategy';
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedPlayTime: string;
  controls: string[];
}

/**
 * Factory function to create a game scene
 */
export type SceneFactory = (engine: Engine) => Scene | Promise<Scene>;

/**
 * A registered game with metadata and scene factory
 */
export interface RegisteredGame {
  meta: GameMeta;
  sceneFactory: SceneFactory;
  hasMenu?: boolean;
  menuFactory?: SceneFactory;
}
