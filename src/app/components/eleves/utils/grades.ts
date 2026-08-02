export type GradeSet = {
  t1: number;
  t2: number;
  t3: number;
};

export function avg(grades: Record<string, GradeSet>, trimestre: 1 | 2 | 3): number {
  const vals = Object.values(grades).map((g) =>
    trimestre === 1 ? g.t1 : trimestre === 2 ? g.t2 : g.t3,
  );
  if (vals.length === 0) return 0;
  return +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
}

export function computeWeightedAvg(
  grades: Record<string, GradeSet>,
  trimestre: 1 | 2 | 3,
  schema: Record<string, number>,
  disciplineConfig?: Record<string, boolean>,
): number {
  const entries = Object.entries(grades).filter(
    ([disc]) => !disciplineConfig || disciplineConfig[disc] !== false,
  );
  if (!entries.length) return 0;

  const normalized = entries.map(([disc, g]) => {
    const raw = trimestre === 1 ? g.t1 : trimestre === 2 ? g.t2 : g.t3;
    const max = schema[disc] ?? 10;
    return max > 0 ? (raw / max) * 10 : 0;
  });

  return +(normalized.reduce((a, b) => a + b, 0) / normalized.length).toFixed(2);
}

export function totalAbsencesNJ(att: Array<"P" | "ANJ" | "AJ" | "R">): number {
  return att.filter((a) => a === "ANJ").length;
}
