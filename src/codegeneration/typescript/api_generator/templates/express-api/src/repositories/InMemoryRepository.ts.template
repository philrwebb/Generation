import { Repository } from './Repository';

export class InMemoryRepository<T extends { id: number }>
  implements Repository<T>
{
  private items: T[] = [];
  private currentId: number = 1;

  async getAll(): Promise<T[]> {
    return this.items;
  }

  async getById(id: number): Promise<T | null> {
    const item = this.items.find((item) => item.id === id) || null;
    return item;
  }

  async create(item: Omit<T, 'id'>): Promise<T> {
    const newItem = { ...item, id: this.currentId++ } as T;
    this.items.push(newItem);
    return newItem;
  }

  async update(id: number, item: Partial<T>): Promise<T | null> {
    const index = this.items.findIndex(
      (existingItem) => existingItem.id === id,
    );
    if (index === -1) return null;

    this.items[index] = { ...this.items[index], ...item };
    return this.items[index];
  }

  async delete(id: number): Promise<boolean> {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) return false;

    this.items.splice(index, 1);
    return true;
  }
}
