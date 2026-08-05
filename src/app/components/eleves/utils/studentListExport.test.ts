import { describe, expect, it } from "vitest";
import { getPrintableStudents } from "./studentListExport";

describe("getPrintableStudents", () => {
  const students = [
    { id: "1", nom: "Diop", prenom: "Awa", matricule: "A001" },
    { id: "2", nom: "Fall", prenom: "Bamba", matricule: "B002" },
    { id: "3", nom: "Sarr", prenom: "Cisse", matricule: "C003" },
  ];

  it("returns all students when search is empty", () => {
    expect(getPrintableStudents(students, "")).toEqual(students);
  });

  it("filters students by a case-insensitive search across nom, prenom and matricule", () => {
    expect(getPrintableStudents(students, "bamba")).toEqual([students[1]]);
    expect(getPrintableStudents(students, "A00")).toEqual([students[0]]);
    expect(getPrintableStudents(students, "SARR")).toEqual([students[2]]);
  });
});
