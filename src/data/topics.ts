export interface Topic {
  id: string;
  title: string;
  description: string;
  content: string;
  related: string[];
  category: string;
  image_url?: string;
  video_url?: string;
}

export const topics: Topic[] = [
  {
    id: "philosophy-of-time",
    title: "The Philosophy of Time",
    description: "Is time a flow, or a static dimension? Explore the A-theory and B-theory of time.",
    content: "Time is one of the most mysterious aspects of our existence. Philosophers have long debated whether time is something that 'flows' (Presentism) or if all moments in time—past, present, and future—are equally real (Eternalism). In the A-theory, the 'now' is a privileged point moving through time. In the B-theory, time is like space; 'here' is relative to the observer, and so is 'now'.",
    related: ["stocism-and-focus"],
    category: "Philosophy",
    image_url: "https://images.unsplash.com/photo-1501139083538-0139583c060f?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "stocism-and-focus",
    title: "Stoicism and Focus",
    description: "Ancient wisdom for modern distractions. Reclaiming your attention.",
    content: "The Stoics believed that the only thing we truly control is our own mind and our reactions to external events. In an age of infinite scrolling, the Stoic practice of 'prosochē' (attention) is more relevant than ever. It is the art of being present and choosing where your mental energy goes, rather than letting it be harvested by algorithms.",
    related: ["philosophy-of-time"],
    category: "Philosophy",
    image_url: "https://images.unsplash.com/photo-1543165796-5426273eaab3?auto=format&fit=crop&w=1200&q=80"
  }
];
