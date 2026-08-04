import { projectId } from "../../utils/supabase/info";

// Supabase Storage bucket that holds the 3 official curriculum guide PDFs.
// Admin must upload: guide_etape_1.pdf, guide_etape_2.pdf, guide_etape_3.pdf
const GUIDES_BUCKET = "guides";

/**
 * Build a direct URL to a page in an official curriculum PDF.
 * Returns null when either field is missing (no link to show).
 */
export function guideDocUrl(
  documentRef: string | null | undefined,
  pageSource: number | null | undefined,
): string | null {
  if (!documentRef || !pageSource) return null;
  const base = `https://${projectId}.supabase.co/storage/v1/object/public/${GUIDES_BUCKET}`;
  return `${base}/${documentRef}.pdf#page=${pageSource}`;
}
