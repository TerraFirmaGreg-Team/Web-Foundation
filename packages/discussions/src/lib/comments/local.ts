import 'server-only';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type {
  Comment,
  StorageAdapter,
  UserProfile,
} from '@fuma-comment/server';
import { env } from '@terrafirmagreg-team/data';

interface LocalComment {
  id: string;
  page: string;
  threadId?: string;
  author: UserProfile;
  content: object;
  timestamp: string;
  rates: Record<string, 1 | -1>;
}

interface LocalData {
  comments: LocalComment[];
}

const dataFile = env('COMMENTS_DATA') || 'data/comments.json';
const DEV_ROLE = { name: 'dev', canDelete: true };

let state: LocalData | undefined;

function data(): LocalData {
  if (!state) {
    state = { comments: [] };
    try {
      if (existsSync(/* turbopackIgnore: true */ dataFile))
        state = JSON.parse(
          readFileSync(/* turbopackIgnore: true */ dataFile, 'utf8'),
        ) as LocalData;
    } catch {}
  }
  return state;
}

function persist() {
  mkdirSync(/* turbopackIgnore: true */ dirname(dataFile), { recursive: true });
  writeFileSync(
    /* turbopackIgnore: true */ dataFile,
    `${JSON.stringify(state, null, 2)}\n`,
  );
}

function find(id: string): LocalComment | undefined {
  return data().comments.find((c) => c.id === id);
}

function toView(
  c: LocalComment,
  authId: string | undefined,
  all: LocalComment[],
): Comment {
  let likes = 0;
  let dislikes = 0;
  for (const rate of Object.values(c.rates))
    rate === 1 ? likes++ : dislikes++;
  const rated = authId ? c.rates[authId] : undefined;
  return {
    id: c.id,
    threadId: c.threadId,
    page: c.page,
    author: c.author,
    content: c.content,
    likes,
    dislikes,
    replies: all.filter((r) => r.threadId === c.id).length,
    timestamp: new Date(c.timestamp),
    liked: rated === undefined ? undefined : rated === 1,
  };
}

export function createLocalComments(): StorageAdapter {
  return {
    getComments({ after, before, limit, sort, page, auth, thread }) {
      const all = data().comments;
      const authId = auth?.id;
      return all
        .filter(
          (c) =>
            (page === undefined || c.page === page) &&
            (thread === undefined ? !c.threadId : c.threadId === thread) &&
            (!before || new Date(c.timestamp) < before) &&
            (!after || new Date(c.timestamp) > after),
        )
        .sort((a, b) =>
          sort === 'oldest'
            ? a.timestamp.localeCompare(b.timestamp)
            : b.timestamp.localeCompare(a.timestamp),
        )
        .slice(0, limit)
        .map((c) => toView(c, authId, all));
    },
    postComment({ auth, body, page }) {
      const comment: LocalComment = {
        id: `c_${crypto.randomUUID()}`,
        page,
        threadId: body.thread,
        author: { id: auth.id, name: auth.id },
        content: body.content,
        timestamp: new Date().toISOString(),
        rates: {},
      };
      data().comments.push(comment);
      persist();
      return toView(comment, auth.id, data().comments);
    },
    updateComment({ id, body }) {
      const comment = find(id);
      if (!comment) return;
      comment.content = body.content;
      persist();
    },
    deleteComment({ id }) {
      const d = data();
      const dead = new Set([id]);
      let grew = true;
      while (grew) {
        grew = false;
        for (const c of d.comments)
          if (c.threadId && dead.has(c.threadId) && !dead.has(c.id)) {
            dead.add(c.id);
            grew = true;
          }
      }
      d.comments = d.comments.filter((c) => !dead.has(c.id));
      persist();
    },
    setRate({ id, auth, body }) {
      const comment = find(id);
      if (!comment) return;
      comment.rates[auth.id] = body.like ? 1 : -1;
      persist();
    },
    deleteRate({ id, auth }) {
      const comment = find(id);
      if (!comment) return;
      delete comment.rates[auth.id];
      persist();
    },
    getCommentAuthor({ id }) {
      return find(id)?.author.id ?? null;
    },
    getRole({ auth }) {
      return auth ? DEV_ROLE : null;
    },
    queryUsers({ name, limit }) {
      const query = name.toLowerCase();
      const users = new Map<string, UserProfile>();
      for (const c of data().comments)
        if (!users.has(c.author.id) && c.author.name.toLowerCase().includes(query))
          users.set(c.author.id, c.author);
      return [...users.values()].slice(0, limit);
    },
  };
}

let local: StorageAdapter | undefined;
export function localComments(): StorageAdapter {
  return (local ??= createLocalComments());
}

