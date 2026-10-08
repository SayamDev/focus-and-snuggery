import { Select } from "./Select";
import type { Settings } from "../types";
export function CrisisSupport({
  country,
  onCountry,
  onClear,
}: {
  country: Settings["country"];
  onCountry: (country: Settings["country"]) => void;
  onClear: () => void;
}) {
  const resource =
    country === "GB"
      ? {
          href: "https://www.samaritans.org/how-we-can-help/contact-samaritan/",
          label: "Samaritans: call 116 123",
        }
      : country === "US"
        ? {
            href: "https://988lifeline.org/",
            label: "988 Lifeline: call or text 988",
          }
        : {
            href: "https://findahelpline.com/",
            label: "Find a local crisis helpline",
          };
  return (
    <section
      className="panel support"
      role="alert"
      aria-labelledby="support-title"
    >
      <h2 id="support-title">You deserve support right now</h2>
      <p>
        Let’s pause task planning. If you are in immediate danger, contact your
        local emergency services. You can also reach out to someone you trust.
      </p>
      <label>
        Country for support links
        <Select
          value={country}
          onChange={(e) => onCountry(e.target.value as Settings["country"])}
        >
          <option value="GB">UK and Ireland</option>
          <option value="US">United States</option>
          <option value="other">Another country</option>
        </Select>
      </label>
      <a
        className="button primary"
        href={resource.href}
        target="_blank"
        rel="noreferrer"
      >
        {resource.label} (opens a new tab)
      </a>
      <p className="muted">
        Focus & Snuggery cannot provide crisis counselling. This message is
        based on words in your note, and may not fit your situation.
      </p>
      <button onClick={onClear}>Clear this note</button>
    </section>
  );
}
