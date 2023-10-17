import { Reporter } from "./reporter";

test("exceedsFailureThreshold", () => {
  const reporter = new Reporter(false, "warning");

  expect(reporter.exceedsFailureThreshold("notice")).toBe(false);
  expect(reporter.exceedsFailureThreshold("warning")).toBe(true);
  expect(reporter.exceedsFailureThreshold("failure")).toBe(true);
});
