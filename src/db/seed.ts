import { randomUUID } from 'node:crypto';
import { openDatabase } from './index';
import { posts } from './schema';

const updates = [
  'A small reminder from this week: the best project updates are the ones that make ' +
    'the next step obvious.\n\nWhat changed, what did we learn, and what happens next? ' +
    'Three simple questions, a much better conversation.',
  'We shipped a feature today that started with a five-minute conversation with a customer.\n\n' +
    'Not every useful idea needs a long roadmap. ' +
    'Sometimes it just needs someone willing to listen.',
  'Something I’m practicing: leaving a little more room for questions in meetings.\n\n' +
    'The most useful insight often comes just after you think the discussion is over.',
  'Finished a great week of learning with the team. We paired across disciplines, ' +
    'shared early drafts, and found a simpler way forward.\n\n' +
    'Progress looks a lot like collaboration.',
  'A lesson from a recent project: write the handover while you’re doing the work, not after. ' +
    'Your future teammates will thank you.',
  'Today’s small win: turned a recurring manual task into a repeatable checklist. ' +
    'Less guesswork, fewer missed steps, more time for the work that matters.',
  'There is real value in showing work before it feels finished. ' +
    'Early feedback helped us change direction while it was still easy.',
  'Starting the week with one clear priority and a little space for the unexpected. ' +
    'Focus is as much about what you leave out as what you put on the list.',
];

const { database, sqlite } = openDatabase(
  process.env.DATABASE_URL?.replace(/^file:/, '') ?? './dev.db'
);
try {
  const result = database.transaction((transaction) => {
    if (transaction.select({ id: posts.id }).from(posts).limit(1).get()) return false;
    const now = Date.now();
    transaction
      .insert(posts)
      .values(
        updates.map((content, index) => ({
          id: randomUUID(),
          content,
          createdAt: now - (index + 1) * 3600000,
          updatedAt: null,
        }))
      )
      .run();
    return true;
  });
  console.log(result ? 'Added 8 starter posts.' : 'Feed already has posts; nothing was changed.');
} finally {
  sqlite.close();
}
