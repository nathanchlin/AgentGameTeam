/**
 * Generic object pool for reusing objects to reduce garbage collection.
 *
 * @template T - The type of objects in the pool
 */
export class ObjectPool<T> {
  private availableItems: Set<T> = new Set<T>();
  private activeItemsCount: number = 0;
  private readonly factory: () => T;
  private readonly resetCallback?: (item: T) => void;

  /**
   * Creates a new object pool.
   *
   * @param factory - Function that creates new instances of type T
   * @param initialSize - Number of objects to pre-allocate (default: 0)
   * @param resetCallback - Optional function to reinitialize objects when returned to pool
   */
  constructor(factory: () => T, initialSize: number = 0, resetCallback?: (item: T) => void) {
    this.factory = factory;
    this.resetCallback = resetCallback;
    this.prewarm(initialSize);
  }

  /**
   * Acquires an object from the pool.
   * Creates a new object if none are available.
   *
   * @returns An object of type T from the pool or newly created
   */
  acquire(): T {
    if (this.availableItems.size === 0) {
      this.activeItemsCount++;
      return this.factory();
    }

    const iterator = this.availableItems.values();
    const result = iterator.next();
    if (result.done || result.value === undefined) {
      this.activeItemsCount++;
      return this.factory();
    }
    const item = result.value;
    this.availableItems.delete(item);
    this.activeItemsCount++;
    return item;
  }

  /**
   * Returns an object to the pool for reuse.
   * Calls the reset callback if one was provided.
   *
   * @param item - The object to return to the pool
   */
  release(item: T): void {
    if (this.resetCallback) {
      this.resetCallback(item);
    }
    this.availableItems.add(item);
    this.activeItemsCount--;
  }

  /**
   * Gets the number of objects currently in use.
   *
   * @returns The count of active objects
   */
  getActiveCount(): number {
    return this.activeItemsCount;
  }

  /**
   * Pre-allocates objects in the pool.
   * Useful for warming up the pool to avoid allocation during gameplay.
   *
   * @param count - Number of objects to add to the pool
   */
  prewarm(count: number): void {
    for (let i = 0; i < count; i++) {
      this.availableItems.add(this.factory());
    }
  }

  /**
   * Gets the total size of the pool (available items only).
   *
   * @returns The count of available objects in the pool
   */
  getAvailableCount(): number {
    return this.availableItems.size;
  }
}
