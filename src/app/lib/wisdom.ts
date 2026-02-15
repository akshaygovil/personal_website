// lib/wisdom.ts

export type WisdomPost = {
  id: string;
  content: string; // Supports \n for line breaks and **text** for bold
  date: string; // ISO date string
};

export const wisdomPosts: WisdomPost[] = [
  {
    id: "1",
    content: "The best systems are the ones you don't have to think about. They just work.\n\nWhen building automation or workflows, the goal isn't to impress with complexity—it's to create something so intuitive that using it feels effortless. **The best code is code that doesn't need documentation because it's self-explanatory.**",
    date: "2025-01-15",
  },
  {
    id: "2",
    content: "Progress over perfection. Small consistent actions compound into extraordinary results.\n\nI've seen too many projects die because people waited for the perfect moment, the perfect plan, or the perfect team. **Start messy. Iterate. Ship.** The act of doing teaches you more than planning ever will.",
    date: "2025-01-20",
  },
  {
    id: "3",
    content: "Focus on systems, not goals. Build habits that make success inevitable.\n\nA goal is a destination; a system is the vehicle. When you focus on the system—the daily practices, the routines, the processes—**the goals become inevitable byproducts.**\n\nThis applies to code, fitness, learning, everything.",
    date: "2025-01-25",
  },
  {
    id: "4",
    content: "The obstacle is the way. Every challenge is an opportunity in disguise.\n\nWhen something breaks, when a feature doesn't work, when a client pushes back—that's not a problem, **that's data.** It's telling you something important about what you're building. Listen to it.",
    date: "2025-02-01",
  },
  {
    id: "5",
    content: "Clarity comes from action, not thought. **Start before you're ready.**\n\nThe best way to understand a problem is to start solving it. You'll learn more in the first hour of building than in days of planning.\n\nCode reveals truth. Build to learn, not just to ship.",
    date: "2025-02-04",
  },
  {
    id: "6",
    content: "Most people overestimate what they can do in a day and underestimate what they can do in a year.\n\n**Consistency beats intensity.** One hour every day for a year is 365 hours. That's enough to become genuinely good at almost anything.\n\nThe compound effect is real, and it's powerful.",
    date: "2025-02-05",
  },
  {
    id: "7",
    content: "The best code is code you don't have to write.\n\nBefore adding a feature, ask: does this already exist? Can I use a library? Can I simplify the problem?\n\n**Every line of code is a liability. Every abstraction is a trade-off.** Choose wisely.",
    date: "2025-02-06",
  },
];

/**
 * Get a random wisdom post
 */
export function getRandomWisdom(): WisdomPost {
  return wisdomPosts[Math.floor(Math.random() * wisdomPosts.length)];
}

/**
 * Get wisdom post by date (for daily rotation)
 * Uses the day of year to cycle through posts
 */
export function getDailyWisdom(): WisdomPost {
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 0);
  const diff = today.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const index = dayOfYear % wisdomPosts.length;
  return wisdomPosts[index];
}

/**
 * Get all wisdom posts, sorted by date (newest first)
 */
export function getAllWisdom(): WisdomPost[] {
  return [...wisdomPosts].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
