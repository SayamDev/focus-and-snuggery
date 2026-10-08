import { stepsSchema, type Effort, type Step, type Task } from "../types";
// Detection is deliberately independent of the optional model. It is a safety
// gate, not a clinical assessment; it cannot reliably understand every phrase.
export function isCrisis(text: string): boolean {
  return /\b(kill\s+myself|end\s+my\s+life|suicid\w*|self[- ]?harm|hurt\s+myself|want\s+to\s+die|don't\s+want\s+to\s+(live|be\s+alive)|do\s+not\s+want\s+to\s+live|better\s+off\s+dead|can't\s+go\s+on|cannot\s+go\s+on|cut\s+myself|overdose)\b/i.test(
    text.replace(/[’]/g, "'"),
  );
}
const recipes: Array<[RegExp, Step[]]> = [
  [
    /\b(dinner|lunch|breakfast|meal)\b/i,
    [
      { title: "Check which ingredients you have", minutes: 3, effort: "low" },
      { title: "Choose one simple meal", minutes: 2, effort: "low" },
      {
        title: "Gather the ingredients and utensils",
        minutes: 5,
        effort: "low",
      },
    ],
  ],
  [
    /\b(clean|tidy)\b.*\b(room|bedroom|house)\b/i,
    [
      { title: "Put dirty clothes in the hamper", minutes: 5, effort: "low" },
      {
        title: "Put five things back where they belong",
        minutes: 5,
        effort: "low",
      },
      { title: "Clear one small surface", minutes: 5, effort: "medium" },
    ],
  ],
  [
    /\b(email|inbox|message)\b/i,
    [
      {
        title: "Open the message you need to answer",
        minutes: 2,
        effort: "low",
      },
      { title: "Write a short draft reply", minutes: 5, effort: "medium" },
      {
        title: "Read your draft and send it when ready",
        minutes: 2,
        effort: "low",
      },
    ],
  ],
  [
    /\b(essay|report|project|assignment|document)\b/i,
    [
      {
        title: "Open the document you want to work on",
        minutes: 2,
        effort: "low",
      },
      { title: "Write three points to include", minutes: 5, effort: "medium" },
      { title: "Write one short paragraph", minutes: 10, effort: "medium" },
    ],
  ],
  [
    /\b(dishes|washing up)\b/i,
    [
      {
        title: "Gather cups and plates by the sink",
        minutes: 2,
        effort: "low",
      },
      { title: "Wash five dishes", minutes: 5, effort: "medium" },
    ],
  ],
  [
    /\b(laundry|wash clothes)\b/i,
    [
      { title: "Gather one load of clothes", minutes: 5, effort: "low" },
      {
        title: "Put the load in the washing machine",
        minutes: 5,
        effort: "medium",
      },
    ],
  ],
  [
    /\b(shop|groceries|shopping)\b/i,
    [
      { title: "Write down three things you need", minutes: 3, effort: "low" },
      { title: "Check what you already have", minutes: 5, effort: "low" },
      {
        title: "Choose when to get the things on your list",
        minutes: 2,
        effort: "low",
      },
    ],
  ],
];
export function analyseDump(text: string): {
  steps: Step[];
  unclear: string[];
} {
  if (isCrisis(text)) throw new Error("crisis");
  const parts = text
    .trim()
    .split(/\n+|[.!?;]+|,|\s+and\s+|\s+also\s+/i)
    .map((s) => s.trim().replace(/^(i\s+)?(need|have|want)\s+to\s+/i, ""))
    .filter(Boolean);
  const steps: Step[] = [];
  const unclear: string[] = [];
  for (const part of parts) {
    const recipe = recipes.find(([pattern]) => pattern.test(part));
    const concrete =
      /^(open|put|write|read|pick|gather|wash|clear|call|send|check|take|drink|fill|make|choose|pay|book|fold|walk|buy|prepare|find|collect)\s+\S+/i.test(
        part,
      );
    const suggestions = recipe
      ? recipe[1].map((step) => ({ ...step }))
      : concrete
        ? [
            {
              title: part.charAt(0).toUpperCase() + part.slice(1),
              minutes: 5,
              effort: "low" as Effort,
            },
          ]
        : [];
    if (
      suggestions.length &&
      steps.length + suggestions.length <= 40 &&
      part.length <= 180
    )
      steps.push(...suggestions);
    else unclear.push(part);
  }
  return { steps, unclear };
}
export function fallbackSplit(text: string): Step[] {
  return analyseDump(text).steps;
}
export function tinySteps(title: string): Step[] {
  if (/clothes|hamper/i.test(title))
    return [
      { title: "Find the hamper or a laundry bag", minutes: 2, effort: "low" },
      { title: "Pick up three pieces of clothing", minutes: 2, effort: "low" },
      { title: "Put those clothes in the hamper", minutes: 2, effort: "low" },
    ];
  if (/dishes|cups|plates/i.test(title))
    return [
      { title: "Put one cup beside the sink", minutes: 2, effort: "low" },
      { title: "Gather a sponge and dish soap", minutes: 2, effort: "low" },
      { title: "Wash just that one cup", minutes: 2, effort: "low" },
    ];
  if (/surface/i.test(title))
    return [
      {
        title: "Choose a small patch of the surface",
        minutes: 2,
        effort: "low",
      },
      {
        title: "Move three items to where they belong",
        minutes: 2,
        effort: "low",
      },
      { title: "Wipe that small patch", minutes: 2, effort: "low" },
    ];
  const known = recipes.find(([pattern]) => pattern.test(title));
  if (known)
    return known[1].length >= 3
      ? known[1].map((s) => ({ ...s }))
      : [
          ...known[1],
          { title: "Check what still needs doing", minutes: 2, effort: "low" },
        ];
  return [
    {
      title: `Write the first action for: ${title}`.slice(0, 180),
      minutes: 2,
      effort: "low",
    },
    {
      title: "Gather the one thing you need to begin",
      minutes: 2,
      effort: "low",
    },
    {
      title: "Try the first action for two minutes",
      minutes: 2,
      effort: "low",
    },
  ];
}
export function parseSteps(raw: string): Step[] {
  const data = JSON.parse(raw);
  const steps = stepsSchema.parse(data.steps);
  const verbs =
    /^(open|put|write|read|pick|gather|wash|clear|call|send|check|take|drink|fill|make|choose|pay|book|fold|walk|place|collect|sort|set|start|list|find|move|wipe|close|save|remove|try|prepare|turn|sit|stand|look|rinse|draft|review)\b/i;
  if (steps.some((s) => !verbs.test(s.title) || isCrisis(s.title)))
    throw new Error("Steps must start with a concrete action");
  return steps;
}
export function orderTasks(tasks: Task[], energy: Effort): Task[] {
  const rank: Record<Effort, number> = { low: 0, medium: 1, high: 2 };
  return tasks
    .filter((t) => t.status === "ready")
    .sort((a, b) => {
      // Low energy prioritizes easy wins. Higher energy first matches effort,
      // then breaks ties by manual order; no task is hidden because of effort.
      const score = (t: Task) =>
        energy === "low"
          ? rank[t.effort]
          : Math.abs(rank[t.effort] - rank[energy]);
      return (
        score(a) - score(b) || a.order - b.order || a.createdAt - b.createdAt
      );
    });
}
export function newTasks(steps: Step[], startOrder = 0): Task[] {
  return steps.map((s, i) => ({
    ...s,
    id: crypto.randomUUID(),
    order: startOrder + i,
    status: "ready",
    createdAt: Date.now(),
  }));
}
