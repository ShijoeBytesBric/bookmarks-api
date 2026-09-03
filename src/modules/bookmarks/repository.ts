import { randomUUID } from 'node:crypto';

import type { Bookmark, CreateBookmark, UpdateBookmark } from './schema.js';

/**
 * Repository contract for bookmark persistence.
 *
 * Implemented in-memory for this demo — the interface exists so a real
 * datastore (Postgres, Redis, ...) can be dropped in without touching routes.
 */
export interface BookmarkRepository {
  list(): Promise<Bookmark[]>;
  getById(id: string): Promise<Bookmark | undefined>;
  create(input: CreateBookmark): Promise<Bookmark>;
  update(id: string, patch: UpdateBookmark): Promise<Bookmark | undefined>;
  delete(id: string): Promise<boolean>;
}

export class InMemoryBookmarkRepository implements BookmarkRepository {
  private readonly bookmarks = new Map<string, Bookmark>();

  async list(): Promise<Bookmark[]> {
    return [...this.bookmarks.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async getById(id: string): Promise<Bookmark | undefined> {
    return this.bookmarks.get(id);
  }

  async create(input: CreateBookmark): Promise<Bookmark> {
    const now = new Date().toISOString();
    const bookmark: Bookmark = {
      id: randomUUID(),
      ...input,
      tags: input.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };
    this.bookmarks.set(bookmark.id, bookmark);
    return bookmark;
  }

  async update(id: string, patch: UpdateBookmark): Promise<Bookmark | undefined> {
    const existing = this.bookmarks.get(id);
    if (!existing) {
      return undefined;
    }
    // updatedAt is strictly monotonic so a rapid update can never produce a
    // timestamp equal to (or older than) the existing one — useful for
    // downstream consumers that order by updatedAt.
    const updatedAt = new Date(
      Math.max(Date.now(), Date.parse(existing.updatedAt) + 1),
    ).toISOString();
    const updated: Bookmark = {
      id: existing.id,
      title: patch.title ?? existing.title,
      url: patch.url ?? existing.url,
      tags: patch.tags ?? existing.tags,
      createdAt: existing.createdAt,
      updatedAt,
    };
    this.bookmarks.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.bookmarks.delete(id);
  }
}

export function createInMemoryBookmarkRepository(): BookmarkRepository {
  return new InMemoryBookmarkRepository();
}
