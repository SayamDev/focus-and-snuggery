import { fallbackSplit, isCrisis, parseSteps, tinySteps } from "./tasks";
import type { Step, Settings } from "../types";
export interface TaskAI {
  split(text: string, small?: boolean): Promise<Step[]>;
}
export class RuleAI implements TaskAI {
  async split(text: string, small = false) {
    if (isCrisis(text)) throw new Error("crisis");
    return small ? tinySteps(text) : fallbackSplit(text);
  }
}
const system = `You turn daily tasks into small physical actions. Output strict JSON only: {"steps":[{"title":"Open the document","minutes":2,"effort":"low"}]}. Each title starts with a concrete action verb. Minutes must be integer 2 through 15. Effort is low, medium, or high. Do not diagnose or give medical, medication, or crisis advice. Be respectful, never shaming or patronizing. No extra fields. Preserve the user's intent. For smaller steps give 3 to 5 actions.`;
async function bounded<T>(
  request: Promise<T>,
  onTimeout: () => void,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      request,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          onTimeout();
          reject(new Error("Inference timed out"));
        }, 20000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
export class WebLLMAI implements TaskAI {
  private engine: Awaited<
    ReturnType<(typeof import("@mlc-ai/web-llm"))["CreateMLCEngine"]>
  > | null = null;
  async load(onProgress: (text: string) => void) {
    if (!("gpu" in navigator))
      throw new Error(
        "This browser does not support WebGPU. The offline splitter still works.",
      );
    const { CreateMLCEngine } = await import("@mlc-ai/web-llm");
    this.engine = await CreateMLCEngine("Qwen2.5-0.5B-Instruct-q4f16_1-MLC", {
      initProgressCallback: (r) => onProgress(r.text),
    });
  }
  async split(text: string, small = false, onFallback?: () => void) {
    if (isCrisis(text)) throw new Error("crisis");
    if (!this.engine) {
      onFallback?.();
      return new RuleAI().split(text, small);
    }
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await bounded(
          this.engine.chat.completions.create({
            messages: [
              { role: "system", content: system },
              {
                role: "user",
                content: `${small ? "Split this into 3–5 tiny actions" : "Split these thoughts into small actions"}: ${text.slice(0, 6000)}`,
              },
            ],
            temperature: 0.2,
            max_tokens: 1200,
            response_format: { type: "json_object" },
          }),
          () => this.engine?.interruptGenerate(),
        );
        const steps = parseSteps(result.choices[0]?.message.content ?? "");
        if (small && (steps.length < 3 || steps.length > 5))
          throw new Error("Invalid count");
        return steps;
      } catch {
        /* Invalid model output retries once, then uses the local fallback. */
      }
    }
    onFallback?.();
    return new RuleAI().split(text, small);
  }
  async unload() {
    await this.engine?.unload();
    this.engine = null;
  }
}
export const browserAI = new WebLLMAI();
export const ruleAI = new RuleAI();
export async function splitTasks(
  text: string,
  options: { small?: boolean; ai?: boolean; onFallback?: () => void } = {},
) {
  if (isCrisis(text)) throw new Error("crisis");
  return options.ai
    ? browserAI.split(text, options.small, options.onFallback)
    : ruleAI.split(text, options.small);
}
export function toneCopy(
  tone: Settings["tone"],
  neutral: string,
  warm: string,
  brief: string,
) {
  return tone === "warm" ? warm : tone === "brief" ? brief : neutral;
}
