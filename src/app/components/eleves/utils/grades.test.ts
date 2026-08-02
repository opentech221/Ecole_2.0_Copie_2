import { describe, expect, it } from "vitest";
import { avg, computeWeightedAvg, totalAbsencesNJ, type GradeSet } from "./grades";

const grades: Record<string, GradeSet> = {
  Mathematiques: { t1: 8, t2: 6, t3: 7 },
  Francais: { t1: 6, t2: 9, t3: 8 },
  EPS: { t1: 10, t2: 10, t3: 10 },
};

describe("grades utils", () => {
  it("calcule la moyenne simple par trimestre", () => {
    expect(avg(grades, 1)).toBe(8);
    expect(avg(grades, 2)).toBe(8.33);
  });

  it("calcule une moyenne pondérée normalisée et respecte les exclusions", () => {
    const schema = { Mathematiques: 20, Francais: 10, EPS: 5 };
    expect(computeWeightedAvg(grades, 1, schema)).toBe(10);

    const config = { Mathematiques: true, Francais: false, EPS: true };
    expect(computeWeightedAvg(grades, 1, schema, config)).toBe(12);
  });

  it("compte les absences non justifiées", () => {
    expect(totalAbsencesNJ(["P", "ANJ", "AJ", "ANJ", "R"])).toBe(2);
  });
});
