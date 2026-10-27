// src/repositories/FileRepository.ts
import { Repository } from './Repository';
import lowdb from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';

type Schema<T> = {
  items: T[];
};

export class FileRepository<T extends { id: number }> implements Repository<T> {
  private db: lowdb.LowdbSync<Schema<T>>;
  private currentId: number;

  constructor(filePath: string) {
    const adapter = new FileSync<Schema<T>>(filePath);
    this.db = lowdb(adapter);
    this.db.defaults({ items: [] }).write();
    this.currentId = this.db.get('items').value().length + 1;
  }

  async getAll(): Promise<T[]> {
    return this.db.get('items').value();
  }

  async getById(id: number): Promise<T | null> {
    const item =
      (this.db
        .get('items')
        .find((item: T) => item.id === id)
        .value() as T) || null;
    return item;
  }

  async create(item: Omit<T, 'id'>): Promise<T> {
    const newItem = { ...item, id: this.currentId++ } as T;
    this.db.get('items').push(newItem).write();
    return newItem;
  }

  async update(id: number, item: Partial<T>): Promise<T | null> {
    const existingItem = this.db
      .get('items')
      .find((item: T) => item.id === id)
      .value();
    if (!existingItem) return null;

    const updatedItem = { ...existingItem, ...item } as T;
    this.db
      .get('items')
      .find((item: T) => item.id === id)
      .assign(updatedItem)
      .write();
    return updatedItem;
  }

  async delete(id: number): Promise<boolean> {
    const removed = this.db
      .get('items')
      .remove((item: T) => item.id === id)
      .write();
    return removed.length > 0;
  }
}
