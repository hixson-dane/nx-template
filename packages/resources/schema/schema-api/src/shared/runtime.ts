// GitHub Copilot generated code - start
export type RuntimeSnapshot = {
  checkedAt: string;
  uptimeSeconds: number;
};

export const getRuntimeSnapshot = (): RuntimeSnapshot => ({
  checkedAt: new Date().toISOString(),
  uptimeSeconds: Math.floor(process.uptime()),
});
// GitHub Copilot generated code - end
