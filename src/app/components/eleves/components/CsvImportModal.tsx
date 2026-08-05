import React, { useState, useRef, useEffect } from "react";
import { Upload, X, AlertTriangle, CheckCircle, Loader2, FileText, Download, Info } from "lucide-react";
import type { NewStudentForm } from "./AddStudentModal";
import { parseCsv, type ParseResult } from "../utils/csvImport";

interface CsvImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (rows: NewStudentForm[]) => Promise<void>;
  currentCount: number;
  maxStudents: number;
}

export function CsvImportModal({ open, onClose, onImport, currentCount, maxStudents }: CsvImportModalProps) {
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [fileName, setFileName]       = useState("");
  const [importing, setImporting]     = useState(false);
  const [done, setDone]               = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const modelHref = "/samples/eleves_import_modele.csv";

  const reset = React.useCallback(() => {
    setParseResult(null);
    setFileName("");
    setDone(false);
    setImporting(false);
    setImportedCount(0);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  if (!open) return null;

  const available = maxStudents - currentCount;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setDone(false);
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      setParseResult(parseCsv(text));
    };
    reader.readAsText(file, "utf-8");
  };

  const toInsert = parseResult?.valid.slice(0, available) ?? [];
  const skippedCapacity = (parseResult?.valid.length ?? 0) - toInsert.length;

  const handleImport = async () => {
    if (!toInsert.length) return;
    setImporting(true);
    try {
      await onImport(toInsert);
      setImportedCount(toInsert.length);
      setDone(true);
    } finally {
      setImporting(false);
    }
  };

  const successCount = importedCount || toInsert.length;

  const inputStyle: React.CSSProperties = {
    fontFamily: "'Plus Jakarta Sans',sans-serif",
  };

  return (
    <>
      <div className="fixed inset-0 z-[450]" style={{ backgroundColor: "rgba(0,0,0,0.45)" }} onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-[460] bg-card"
           style={{ borderRadius:"20px 20px 0 0", maxHeight:"90vh", display:"flex",
                    flexDirection:"column", boxShadow:"0 -8px 40px rgba(0,0,0,0.18)",
                    fontFamily:"'Plus Jakarta Sans',sans-serif" }}>

        {/* Handle */}
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 4px" }}>
          <div style={{ width:36, height:4, borderRadius:999, backgroundColor:"var(--border)" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3"
             style={{ borderBottom:"1px solid var(--border)" }}>
          <div>
            <p style={{ fontSize:17, fontWeight:800, color:"var(--foreground)", margin:0 }}>
              Importer des élèves (CSV)
            </p>
            <p style={{ fontSize:11, color:"var(--muted-foreground)", margin:0 }}>
              Capacité restante : {available} élève{available > 1 ? "s" : ""}
            </p>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:"50%",
                                             backgroundColor:"var(--muted)", border:"none",
                                             display:"flex", alignItems:"center",
                                             justifyContent:"center", cursor:"pointer" }}>
            <X style={{ width:16, height:16, color:"var(--muted-foreground)" }} />
          </button>
        </div>

        <div style={{ overflowY:"auto", flex:1, padding:"16px 20px 24px",
                      display:"flex", flexDirection:"column", gap:14 }}>

          {/* Format hint */}
          <div style={{ backgroundColor:"var(--muted)", borderRadius:10, padding:"10px 14px",
                        fontSize:12, color:"var(--muted-foreground)" }}>
            <strong style={{ color:"var(--foreground)" }}>Format attendu (CSV) :</strong>{" "}
            colonnes séparées par <code>;</code> ou <code>,</code><br />
            <code style={{ fontSize:11 }}>Matricule ; Nom* ; Prénom* ; Genre ; Date de naissance ; Lieu de naissance ; Tuteur ; Téléphone</code>
            <br /><span style={{ fontSize:11 }}>* obligatoires — encodage UTF-8 recommandé</span>
          </div>

          <a href={modelHref} download
             style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8,
                      alignSelf:"flex-start", padding:"10px 14px", borderRadius:12,
                      backgroundColor:"#1a365d", color:"#fff", fontSize:12, fontWeight:800,
                      textDecoration:"none", boxShadow:"0 4px 14px rgba(26,54,93,0.22)" }}>
            <Download style={{ width:14, height:14 }} />
            Télécharger le modèle CSV
          </a>

          {/* Drop zone / file picker */}
          {!parseResult && (
            <label style={{ display:"flex", flexDirection:"column", alignItems:"center",
                            gap:10, padding:"28px 20px", borderRadius:14,
                            border:"2px dashed var(--border)", cursor:"pointer",
                            backgroundColor:"var(--muted)" }}>
              <Upload style={{ width:28, height:28, color:"var(--primary)" }} />
              <span style={{ fontSize:13, fontWeight:600, color:"var(--foreground)" }}>
                {fileName || "Cliquer pour choisir un fichier CSV"}
              </span>
              <input ref={fileRef} type="file" accept=".csv,text/csv"
                     style={{ display:"none" }} onChange={handleFile} />
            </label>
          )}

          {/* Parse results */}
          {parseResult && !done && (
            <>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <FileText style={{ width:16, height:16, color:"var(--primary)" }} />
                <span style={{ fontSize:13, fontWeight:600, color:"var(--foreground)" }}>{fileName}</span>
                <button onClick={reset}
                        style={{ marginLeft:"auto", fontSize:11, color:"var(--muted-foreground)",
                                 background:"none", border:"none", cursor:"pointer", ...inputStyle }}>
                  Changer
                </button>
              </div>

              {(parseResult.warnings.length > 0 || (!parseResult.valid.length && parseResult.errors.length > 0)) && (
                <div style={{ backgroundColor:"#eff6ff", borderRadius:10, padding:"10px 14px",
                              border:"1px solid #bfdbfe", display:"flex", flexDirection:"column", gap:6 }}>
                  <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                    <Info style={{ width:14, height:14, color:"#2563eb", flexShrink:0, marginTop:2 }} />
                    <div style={{ fontSize:12, color:"#1e3a8a" }}>
                      {parseResult.warnings.length > 0 && (
                        <>
                          <strong>Contrôle du fichier :</strong>
                          <ul style={{ margin:"6px 0 0 16px", padding:0 }}>
                            {parseResult.warnings.map((warning) => (
                              <li key={warning}>{warning}</li>
                            ))}
                          </ul>
                        </>
                      )}
                      {!parseResult.valid.length && parseResult.errors.length > 0 && (
                        <p style={{ fontWeight:700, margin:"6px 0 0" }}>
                          Aucune ligne valide n’a pu être importée.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Summary badges */}
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                <span style={{ fontSize:12, fontWeight:700, padding:"4px 10px", borderRadius:999,
                               backgroundColor:"#dcfce7", color:"#15803d" }}>
                  ✓ {parseResult.valid.length} valide{parseResult.valid.length > 1 ? "s" : ""}
                </span>
                {parseResult.errors.length > 0 && (
                  <span style={{ fontSize:12, fontWeight:700, padding:"4px 10px", borderRadius:999,
                                 backgroundColor:"#fee2e2", color:"#dc2626" }}>
                    ✗ {parseResult.errors.length} erreur{parseResult.errors.length > 1 ? "s" : ""}
                  </span>
                )}
                {skippedCapacity > 0 && (
                  <span style={{ fontSize:12, fontWeight:700, padding:"4px 10px", borderRadius:999,
                                 backgroundColor:"#fef3c7", color:"#b45309" }}>
                    ⚠ {skippedCapacity} ignoré{skippedCapacity > 1 ? "s" : ""} (capacité max)
                  </span>
                )}
                {parseResult.detectedColumns.length > 0 && (
                  <span style={{ fontSize:12, fontWeight:700, padding:"4px 10px", borderRadius:999,
                                 backgroundColor:"#e0f2fe", color:"#0369a1" }}>
                    Colonnes détectées : {parseResult.detectedColumns.length}
                  </span>
                )}
              </div>

              {/* Error list */}
              {parseResult.errors.length > 0 && (
                <div style={{ backgroundColor:"#fef2f2", borderRadius:10, padding:"10px 14px",
                              border:"1px solid #fecaca", maxHeight:100, overflowY:"auto" }}>
                  {parseResult.errors.map(e => (
                    <p key={e.row} style={{ fontSize:12, color:"#dc2626", margin:"2px 0",
                                           display:"flex", gap:6, alignItems:"flex-start" }}>
                      <AlertTriangle style={{ width:12, height:12, flexShrink:0, marginTop:2 }} />
                      {e.msg}
                    </p>
                  ))}
                </div>
              )}

              {parseResult.detectedColumns.length > 0 && (
                <div style={{ backgroundColor:"var(--muted)", borderRadius:10, padding:"10px 14px",
                              fontSize:12, color:"var(--muted-foreground)" }}>
                  <strong style={{ color:"var(--foreground)" }}>Colonnes reconnues :</strong> {parseResult.detectedColumns.join(", ")}
                </div>
              )}

              {/* Preview table (first 5 rows) */}
              {toInsert.length > 0 && (
                <div>
                  <p style={{ fontSize:11, fontWeight:700, color:"var(--muted-foreground)",
                               textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 6px" }}>
                    Aperçu des lignes prêtes à importer ({Math.min(toInsert.length, 5)} sur {toInsert.length})
                  </p>
                  <div style={{ overflowX:"auto", borderRadius:10, border:"1px solid var(--border)" }}>
                    <table style={{ borderCollapse:"collapse", width:"100%", fontSize:12, minWidth:620 }}>
                      <thead>
                        <tr style={{ backgroundColor:"var(--muted)" }}>
                          {["Matricule","Nom","Prénom","Genre","Naissance","Tuteur"].map(h => (
                            <th key={h} style={{ padding:"6px 10px", textAlign:"left", fontWeight:700,
                                                  color:"var(--muted-foreground)" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {toInsert.slice(0, 5).map((r, i) => (
                          <tr key={i} style={{ borderTop:"1px solid var(--border)" }}>
                            <td style={{ padding:"6px 10px", fontFamily:"monospace", color:"var(--muted-foreground)" }}>{r.matricule || "—"}</td>
                            <td style={{ padding:"6px 10px", fontWeight:700 }}>{r.nom}</td>
                            <td style={{ padding:"6px 10px" }}>{r.prenom}</td>
                            <td style={{ padding:"6px 10px" }}>
                              <span style={{ fontSize:10, fontWeight:800, padding:"2px 6px", borderRadius:999,
                                             backgroundColor:r.genre==="F"?"#fce7f3":"#dbeafe",
                                             color:r.genre==="F"?"#be185d":"#1d4ed8" }}>{r.genre}</span>
                            </td>
                            <td style={{ padding:"6px 10px", whiteSpace:"nowrap" }}>{r.dateNaissance || "—"}</td>
                            <td style={{ padding:"6px 10px" }}>{r.tuteurNom || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Done state */}
          {done && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
                          gap:12, padding:"20px 0" }}>
              <CheckCircle style={{ width:40, height:40, color:"#059669" }} />
              <p style={{ fontSize:16, fontWeight:800, color:"var(--foreground)", margin:0 }}>
                {successCount} élève{successCount > 1 ? "s importés" : " importé"} avec succès !
              </p>
              <button onClick={onClose}
                      style={{ marginTop:8, padding:"10px 24px", borderRadius:10, border:"none",
                               backgroundColor:"var(--primary)", color:"#fff", fontWeight:700,
                               fontSize:13, cursor:"pointer", ...inputStyle }}>
                Fermer
              </button>
            </div>
          )}

          {/* Import button */}
          {parseResult && !done && toInsert.length > 0 && (
            <button onClick={handleImport} disabled={importing}
                    style={{ minHeight:48, borderRadius:14, fontWeight:800, fontSize:14,
                             cursor:importing?"not-allowed":"pointer",
                             backgroundColor: toInsert.length ? "#1a365d" : "#94a3b8",
                             color:"#fff", border:"none",
                             display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                             boxShadow:"0 4px 14px rgba(26,54,93,0.28)", ...inputStyle }}>
              {importing
                ? <><Loader2 style={{ width:16, height:16 }} className="animate-spin" /> Importation…</>
                : <><Upload style={{ width:16, height:16 }} /> Importer {toInsert.length} élève{toInsert.length > 1 ? "s" : ""}</>}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
