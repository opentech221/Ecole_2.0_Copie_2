export interface PrintableStudentLike {
  id: string;
  nom: string;
  prenom: string;
  matricule: string;
}

export function getPrintableStudents<T extends PrintableStudentLike>(
  students: T[],
  search: string,
): T[] {
  const normalized = search.trim().toLowerCase();
  if (!normalized) return students;

  return students.filter((student) => {
    const haystack = [student.nom, student.prenom, student.matricule]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalized);
  });
}
