/** What every documentation page may use to show real, copyable examples. */
export interface DocsPageProps {
  /** The Dilanix API base URL, e.g. `https://api.dilanix.com`. */
  baseUrl: string;
  /** The signed-in user's organization — examples use it instead of a placeholder. */
  organizationId: string;
}
