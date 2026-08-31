// GitHub Copilot generated code - start
const startedAtMs = Date.now();

export const getRuntimeSnapshot = (): {
  checkedAt: string;
  uptimeSeconds: number;
} => ({
  checkedAt: new Date().toISOString(),
  uptimeSeconds: Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)),
});
// GitHub Copilot generated code - end
