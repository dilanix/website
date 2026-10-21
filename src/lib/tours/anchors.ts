/** `data-tour` anchors on shared dashboard UI, available to every product's
 *  tours. Product-specific anchors live with that product's tour definition. */
export const sharedTourAnchors = {
  productTabs: "dashboard.product-tabs",
} as const;

export function tourTargetSelector(anchor: string) {
  return `[data-tour="${anchor}"]`;
}
