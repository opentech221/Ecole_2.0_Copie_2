import { projectId } from "../../utils/supabase/info";

const GUIDES_BUCKET = "guides";
const GUIDE_PUBLIC_URLS: Record<string, string> = {
  guide_etape_1:
    "https://macnyqeakdiydttzenrp.supabase.co/storage/v1/object/sign/guides/guide_etape_1.pdf%20(CI,%20CP).pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xMTYzNzc5Mi1mZTQ5LTRhNTctYTAwNS03YjlmOWVkMzUzOTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJndWlkZXMvZ3VpZGVfZXRhcGVfMS5wZGYgKENJLCBDUCkucGRmIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4NTg4NjUyNywiZXhwIjo0OTM5NDg2NTI3fQ.fOX0BaHz4yI3b_1lsA2S4RKhA1eNw40CEZYnozJhC88",
  guide_etape_2:
    "https://macnyqeakdiydttzenrp.supabase.co/storage/v1/object/sign/guides/guide_etape_2.pdf%20(CE1,%20CE2).pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xMTYzNzc5Mi1mZTQ5LTRhNTctYTAwNS03YjlmOWVkMzUzOTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJndWlkZXMvZ3VpZGVfZXRhcGVfMi5wZGYgKENFMSwgQ0UyKS5wZGYiLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg1ODg2NjUxLCJleHAiOjQ5Mzk0ODY2NTF9.YVHoB5MVI3A2Hcb5cq0rnVMmD671luUo9k_TKR2lIFU",
  guide_etape_3:
    "https://macnyqeakdiydttzenrp.supabase.co/storage/v1/object/sign/guides/guide_etape_3.pdf%20(CM1,%20CM2).pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xMTYzNzc5Mi1mZTQ5LTRhNTctYTAwNS03YjlmOWVkMzUzOTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJndWlkZXMvZ3VpZGVfZXRhcGVfMy5wZGYgKENNMSwgQ00yKS5wZGYiLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg1ODg2NzIyLCJleHAiOjQ5Mzk0ODY3MjJ9.Q0v7JRJq-xOno6jo775KezQF_MIZMVemLDNVXsw0F30",
};

/**
 * Build a direct URL to a page in an official curriculum PDF.
 * Returns null when either field is missing (no link to show).
 */
export function guideDocUrl(
  documentRef: string | null | undefined,
  pageSource: number | null | undefined,
): string | null {
  if (!documentRef || !pageSource) return null;

  const publicUrl = GUIDE_PUBLIC_URLS[documentRef];
  if (!publicUrl) {
    const base = `https://${projectId}.supabase.co/storage/v1/object/public/${GUIDES_BUCKET}`;
    return `${base}/${documentRef}.pdf#page=${pageSource}`;
  }

  return `${publicUrl}#page=${pageSource}`;
}
