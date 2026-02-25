let counter = 0;

export function generateId(): string {
  return `entity_${Date.now()}_${counter++}`;
}
