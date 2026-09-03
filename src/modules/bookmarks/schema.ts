import { z } from 'zod';

export const bookmarkSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1).max(120),
  url: z.url(),
  tags: z.array(z.string().min(1).max(32)).max(10).optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

/** Payload for creating a bookmark — id and timestamps are server-generated. */
export const createBookmarkSchema = bookmarkSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

/** Payload for updating a bookmark — every field is optional (PATCH semantics). */
export const updateBookmarkSchema = createBookmarkSchema.partial();

export const bookmarkIdSchema = z.object({ id: z.uuid() });

export type Bookmark = z.infer<typeof bookmarkSchema>;
export type CreateBookmark = z.infer<typeof createBookmarkSchema>;
export type UpdateBookmark = z.infer<typeof updateBookmarkSchema>;
