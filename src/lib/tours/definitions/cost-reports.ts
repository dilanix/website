import type { TourDefinition } from "../types";

export const COST_REPORTS_TOUR_KEY = "cost.reports";

/** Anchors the Reports components set (`data-tour={costReportsAnchors.x}`).
 *  Per-report anchors sit on every row; the tour shows the first. */
export const costReportsAnchors = {
  create: "cost-reports.create",
  formName: "cost-reports.form-name",
  formDescription: "cost-reports.form-description",
  formFormat: "cost-reports.form-format",
  formPeriod: "cost-reports.form-period",
  formSchedule: "cost-reports.form-schedule",
  formDestinations: "cost-reports.form-destinations",
  formScope: "cost-reports.form-scope",
  formSubmit: "cost-reports.form-submit",
  report: "cost-reports.report",
  generate: "cost-reports.generate",
  history: "cost-reports.history",
  reportActions: "cost-reports.report-actions",
} as const;

/** Actions the Reports page registers for this tour (`usePageTour`). */
export const costReportsActions = {
  /** Opens an empty Create report form; its cleanup closes it unsaved. */
  openForm: "open-report-form",
} as const;

const anchors = costReportsAnchors;
const inForm = costReportsActions.openForm;

export const costReportsTour: TourDefinition = {
  key: COST_REPORTS_TOUR_KEY,
  version: 1,
  title: "Cost Reports",
  description: "Set up a scheduled cost report step by step.",
  product: "cost",
  route: "/dashboard/products/cost/reports",
  steps: [
    {
      id: "welcome",
      title: "Welcome to Reports",
      body: "A report is a cost summary Dilanix generates as a CSV or PDF and delivers to email, Slack, Telegram or a webhook — on a schedule, or whenever you ask. This tour shows how to set one up, field by field.",
    },
    {
      id: "create",
      target: anchors.create,
      placement: "bottom",
      title: "Create a report",
      body: "Every report starts here. Let's open the form and go through what each field is for. Nothing is saved or sent during the tour.",
    },
    {
      id: "form-name",
      target: anchors.formName,
      prepare: inForm,
      placement: "right",
      title: "Name",
      body: "Say what the report is and who it's for, e.g. “Monthly cost — finance”.",
    },
    {
      id: "form-description",
      target: anchors.formDescription,
      prepare: inForm,
      placement: "right",
      title: "Description (optional)",
      body: "Notes for your team: what the report covers and who relies on it.",
    },
    {
      id: "form-format",
      target: anchors.formFormat,
      prepare: inForm,
      placement: "right",
      title: "Format",
      body: "CSV — for spreadsheets: the period's daily totals, then each service's spend against the previous period of the same length.\nPDF — a formatted document with the daily totals and the grand total, for reading and sharing.",
    },
    {
      id: "form-period",
      target: anchors.formPeriod,
      prepare: inForm,
      placement: "right",
      title: "Cost period",
      body: "Which spend each report covers, worked out when it runs: last 7 or 30 days, last calendar month, month to date, last calendar quarter or last calendar year. E.g. a report on the 1st with Last calendar month covers the month that just ended.",
    },
    {
      id: "form-schedule",
      target: anchors.formSchedule,
      prepare: inForm,
      placement: "right",
      title: "Schedule",
      body: "On-demand only, or every day, week or month at a time you choose — all times are UTC; a monthly report runs on a day from 1 to 28. Custom takes a cron expression, e.g. 0 8 1 * * for 08:00 UTC on the 1st. The line underneath spells out exactly when it will run.",
    },
    {
      id: "form-destinations",
      target: anchors.formDestinations,
      prepare: inForm,
      placement: "right",
      title: "Notification destinations",
      body: "Where to deliver the report — pick at least one. Destinations (an email list, a Slack channel, a Telegram chat or a webhook) are set up once in Notifications and shared by every report; disabled ones can't be picked.",
    },
    {
      id: "form-scope",
      target: anchors.formScope,
      prepare: inForm,
      placement: "right",
      title: "Scope: which spend the report covers",
      body: "Empty means all of your spend. Add condition narrows it: pick a field (Provider, Billing account ID, Service, Region, Tag…), how to match (is, is any of, is none of) and the value — e.g. Tag team is platform for a team's own report. A charge must match every condition.",
    },
    {
      id: "form-submit",
      target: anchors.formSubmit,
      prepare: inForm,
      placement: "top",
      title: "Save it",
      body: "Create report saves it; a scheduled report then runs on its own. We'll close this form unsaved and look at the list.",
    },
    {
      id: "report",
      target: anchors.report,
      title: "A report",
      body: "Each row shows the report's name, whether it's Enabled, its format, its schedule and next run, its cost period, how many destinations it goes to, and its scope.",
    },
    {
      id: "generate",
      target: anchors.generate,
      placement: "left",
      title: "Generate & send",
      body: "Produces the report right now and sends it to its destinations, without waiting for the schedule — handy to check what recipients will get. It needs at least one destination.",
    },
    {
      id: "history",
      target: anchors.history,
      placement: "left",
      title: "History",
      body: "Every copy of the report generated so far: view it in the browser, download it, or delete it.",
    },
    {
      id: "report-actions",
      target: anchors.reportActions,
      placement: "left",
      title: "Disable, edit or delete",
      body: "Disable pauses the schedule without deleting anything — Generate & send still works. Edit opens the same form; Delete removes the report for good.",
    },
    {
      id: "finish",
      title: "You're all set",
      body: "Replay this tour anytime from Help & Support — the question-mark button at the top of the page.",
    },
  ],
};
