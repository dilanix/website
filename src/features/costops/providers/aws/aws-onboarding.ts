export const AWS_ACCOUNT_ID_PATTERN = /^\d{12}$/;

export function isAwsAccountId(value: string) {
  return AWS_ACCOUNT_ID_PATTERN.test(value);
}

export function awsVerificationErrorMessage(
  status: number | undefined,
  backendMessage = "",
) {
  if (status === 404) {
    return "This integration no longer exists. Close this window and connect AWS again.";
  }
  if (status === 409) {
    return "This integration has been disconnected. Reconnect is not currently available.";
  }
  if (status === 502) {
    return "AWS is temporarily unavailable — please try again in a moment.";
  }
  if (status === 422) {
    if (backendMessage.toLowerCase().includes("belongs to account")) {
      return "That doesn't look like the AWS account the role belongs to — double check the account ID.";
    }
    return "Dilanix couldn't assume the role in that AWS account. Make sure the CloudFormation stack finished creating, then try again.";
  }
  return "Dilanix couldn't verify this AWS account. Please try again.";
}
