import { describe, expect, it } from "vitest";

import { coverUrl } from "@/lib/covers";

describe("coverUrl", () => {
  it("builds the address from the digits of an ISBN-13", () => {
    expect(coverUrl("978-0-7475-3269-9")).toBe(
      "https://covers.openlibrary.org/b/isbn/9780747532699-M.jpg?default=false"
    );
  });

  it("asks for the size it is given", () => {
    expect(coverUrl("9780747532699", "L")).toContain("-L.jpg");
  });

  it("drops the hyphens the catalogue stores", () => {
    // The same number written both ways has to reach the same image, or a
    // title gets a cover only when a librarian happened to omit the hyphens.
    expect(coverUrl("978-0-452-28423-4")).toBe(coverUrl("9780452284234"));
  });

  it("takes an ISBN-10, including the X check letter", () => {
    expect(coverUrl("0-7475-3269-9")).toContain("/0747532699-M.jpg");
    expect(coverUrl("043942089X")).toContain("/043942089X-M.jpg");
  });

  it("always turns off the placeholder pixel", () => {
    // Without this the service answers a missing cover with a 1×1 transparent
    // pixel and a 200, which no error handler can catch.
    expect(coverUrl("9780747532699")).toContain("?default=false");
  });

  it("has no address for a number that is not an ISBN", () => {
    expect(coverUrl("")).toBeNull();
    expect(coverUrl("12345")).toBeNull();
    expect(coverUrl("ikke et nummer")).toBeNull();
  });
});
