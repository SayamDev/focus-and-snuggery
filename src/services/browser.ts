export async function requestNotifications(): Promise<string> {
  if (!("Notification" in window))
    return "Notifications are not available in this browser.";
  const result = await Notification.requestPermission();
  return result === "granted"
    ? "Soft notifications are enabled on this device."
    : "Notifications were not enabled. On-screen timer messages still work.";
}
export async function clearModelCache() {
  if (!("caches" in window)) return;
  // Only WebLLM cache names are removed; the installed app cache is retained.
  const keys = await caches.keys();
  await Promise.all(
    keys.filter((k) => /webllm|web-llm/i.test(k)).map((k) => caches.delete(k)),
  );
}
