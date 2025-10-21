export const ROLES = {
  Technicus: { productive: 1 },
  Constructie: { productive: 1 },
  Expeditie: { productive: 1 },
  Bala: { productive: 1 },
  "Meewerkend voorman": { productive: 0.5 },
  Teamleider: { productive: 0 },
  Manager: { productive: 0 },
  WVB: { productive: 0 },
};

export const REASONS = [
  "verlof",
  "ziekte",
  "training",
  "werktelders",
  "afwezig",
];

export const REASON_COLORS = {
  verlof: "var(--r-verlof)",
  ziekte: "var(--r-ziekte)",
  training: "var(--r-training)",
  werktelders: "var(--r-werktelders)",
  afwezig: "var(--r-afwezig)",
};

export const STORAGE_KEY = "verlofplanner.v2.2";
