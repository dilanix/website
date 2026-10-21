import type { TourDefinition } from "../types";

export const COST_SAVED_VIEWS_TOUR_KEY = "cost.saved-views";

/** Anchors the Saved Views components set (`data-tour={costSavedViewsAnchors.x}`).
 *  Per-view anchors sit on every row; the tour shows the first. */
export const costSavedViewsAnchors = {
  create: "cost-saved-views.create",
  formName: "cost-saved-views.form-name",
  formDescription: "cost-saved-views.form-description",
  formGranularity: "cost-saved-views.form-granularity",
  formVisibility: "cost-saved-views.form-visibility",
  formGroupBy: "cost-saved-views.form-group-by",
  formScope: "cost-saved-views.form-scope",
  formSubmit: "cost-saved-views.form-submit",
  view: "cost-saved-views.view",
  viewActions: "cost-saved-views.view-actions",
} as const;

/** Actions the Saved Views page registers for this tour (`usePageTour`). */
export const costSavedViewsActions = {
  /** Opens an empty Create saved view form; its cleanup closes it unsaved. */
  openForm: "open-saved-view-form",
} as const;

const anchors = costSavedViewsAnchors;
const inForm = costSavedViewsActions.openForm;

export const costSavedViewsTour: TourDefinition = {
  key: COST_SAVED_VIEWS_TOUR_KEY,
  version: 1,
  title: "Cost Saved Views",
  description: "Save a cost breakdown step by step and reuse it in Explorer.",
  product: "cost",
  route: "/dashboard/products/cost/saved-views",
  steps: [
    {
      id: "welcome",
      title: "Welcome to Saved Views",
      body: "A saved view keeps a cost breakdown you check often — its grouping, granularity and filters — so you can run it in Explorer in one step instead of rebuilding it. This tour shows how to create one, field by field.",
    },
    {
      id: "create",
      target: anchors.create,
      placement: "bottom",
      title: "Create a saved view",
      body: "Every saved view starts here. Let's open the form and go through what each field is for. Nothing is saved during the tour.",
    },
    {
      id: "form-name",
      target: anchors.formName,
      prepare: inForm,
      placement: "right",
      title: "Name",
      body: "Say what the view shows, e.g. “Production spend by service”. It's how you'll find the view in Explorer's Saved view list.",
    },
    {
      id: "form-description",
      target: anchors.formDescription,
      prepare: inForm,
      placement: "right",
      title: "Description (optional)",
      body: "What the view is for or who relies on it — handy once it's shared with your organization.",
    },
    {
      id: "form-granularity",
      target: anchors.formGranularity,
      prepare: inForm,
      placement: "right",
      title: "Granularity",
      body: "Whether the view's results come one row per day, week or month — e.g. Monthly for a month-over-month review.",
    },
    {
      id: "form-visibility",
      target: anchors.formVisibility,
      prepare: inForm,
      placement: "right",
      title: "Visibility",
      body: "Only me keeps the view private to you. Everyone in the org shares it with your whole organization: everyone can run it, but only you can edit or delete it.",
    },
    {
      id: "form-group-by",
      target: anchors.formGroupBy,
      prepare: inForm,
      placement: "right",
      title: "Group by",
      body: "The dimensions to split spend by — click to turn each on or off, e.g. Service and Region for each service's spend per region. Leave them all off for a single total per period.",
    },
    {
      id: "form-scope",
      target: anchors.formScope,
      prepare: inForm,
      placement: "right",
      title: "Scope: which spend the view covers",
      body: "Empty means all of your spend. Add condition narrows it: pick a field (Provider, Billing account ID, Service, Region, Tag…), how to match (is, is any of, is none of) and the value — e.g. Tag environment is production. A charge must match every condition.",
    },
    {
      id: "form-submit",
      target: anchors.formSubmit,
      prepare: inForm,
      placement: "top",
      title: "Save it",
      body: "Create saved view saves it. We'll close this form unsaved and look at the list.",
    },
    {
      id: "view",
      target: anchors.view,
      title: "A saved view",
      body: "Each row shows the view's name, whether it's Private or shared with your Organization, and whether you created it — then its granularity, grouping and scope.",
    },
    {
      id: "view-actions",
      target: anchors.viewActions,
      placement: "left",
      title: "Edit or delete",
      body: "Edit opens the same form; Delete removes the view for everyone. Only the person who created a view sees these.",
    },
    {
      id: "finish",
      title: "Use it in Explorer",
      body: "Open Explorer, pick the view under Saved view and choose Run view: its grouping, granularity and filters apply to whatever dates you set there. Replay this tour anytime from Help & Support.",
    },
  ],
};
