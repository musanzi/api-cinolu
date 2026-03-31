export type CoachOutput = {
  type: string;
  title: string;
  summary: string;
  bullets: string[];
  ventureFocus: string;
  scopeCheck: {
    profile: string;
    role: string;
    grounded: boolean;
  };
};
