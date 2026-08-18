import { describe, expect, it } from "vitest";
import { awsVerificationErrorMessage, isAwsAccountId } from "./aws-onboarding";

describe("AWS onboarding", () => {
  it("accepts exactly 12 digits as an AWS account ID", () => {
    expect(isAwsAccountId("123456789012")).toBe(true);
    expect(isAwsAccountId("12345678901")).toBe(false);
    expect(isAwsAccountId("1234567890123")).toBe(false);
    expect(isAwsAccountId("1234-5678-9012")).toBe(false);
  });

  it.each([
    [404, "", "This integration no longer exists."],
    [409, "", "This integration has been disconnected."],
    [502, "", "AWS is temporarily unavailable"],
    [422, "AccessDenied", "Dilanix couldn't assume the role"],
    [422, "Identity belongs to account 111", "double check the account ID"],
  ])("maps HTTP %s to safe customer copy", (status, detail, expected) => {
    expect(awsVerificationErrorMessage(status, detail)).toContain(expected);
  });

  it("never returns an unknown backend message", () => {
    const raw = "botocore.exceptions.ClientError: secret internals";
    expect(awsVerificationErrorMessage(500, raw)).not.toContain(raw);
  });
});
