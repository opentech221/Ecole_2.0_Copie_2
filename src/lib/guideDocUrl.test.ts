import { describe, expect, it } from "vitest";
import { guideDocUrl } from "./guideDocUrl";

describe("guideDocUrl", () => {
  it("uses the public Supabase guide link for the first guide step", () => {
    expect(guideDocUrl("guide_etape_1", 4)).toBe(
      "https://macnyqeakdiydttzenrp.supabase.co/storage/v1/object/sign/guides/guide_etape_1.pdf%20(CI,%20CP).pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xMTYzNzc5Mi1mZTQ5LTRhNTctYTAwNS03YjlmOWVkMzUzOTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJndWlkZXMvZ3VpZGVfZXRhcGVfMS5wZGYgKENJLCBDUCkucGRmIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4NTg4NjUyNywiZXhwIjo0OTM5NDg2NTI3fQ.fOX0BaHz4yI3b_1lsA2S4RKhA1eNw40CEZYnozJhC88#page=4",
    );
  });

  it("uses the public Supabase guide link for the second guide step", () => {
    expect(guideDocUrl("guide_etape_2", 7)).toBe(
      "https://macnyqeakdiydttzenrp.supabase.co/storage/v1/object/sign/guides/guide_etape_2.pdf%20(CE1,%20CE2).pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xMTYzNzc5Mi1mZTQ5LTRhNTctYTAwNS03YjlmOWVkMzUzOTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJndWlkZXMvZ3VpZGVfZXRhcGVfMi5wZGYgKENFMSwgQ0UyKS5wZGYiLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg1ODg2NjUxLCJleHAiOjQ5Mzk0ODY2NTF9.YVHoB5MVI3A2Hcb5cq0rnVMmD671luUo9k_TKR2lIFU#page=7",
    );
  });
});
