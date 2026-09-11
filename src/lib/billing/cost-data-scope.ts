export interface CostDataScopeSearchParams {
  connection?: string | string[];
  target?: string | string[];
}

export interface CostDataScope {
  connectionId: string | null;
  targetId: string | null;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function firstUuid(value: string | string[] | undefined) {
  const resolved = Array.isArray(value) ? value[0] : value;
  const trimmed = resolved?.trim();
  return trimmed && UUID_PATTERN.test(trimmed) ? trimmed : null;
}

export function parseCostDataScope(
  params: CostDataScopeSearchParams,
): CostDataScope {
  const connectionId = firstUuid(params.connection);
  return {
    connectionId,
    targetId: connectionId ? firstUuid(params.target) : null,
  };
}
