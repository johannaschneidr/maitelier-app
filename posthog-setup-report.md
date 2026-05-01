<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into CraftPass. PostHog is initialized via `instrumentation-client.ts` (the recommended approach for Next.js 15.3+), using a reverse proxy through `/ingest` to improve ad-blocker resilience. Ten client-side events are captured across the main `ScheduleView` component, covering all key user interactions: filter usage, class saves/unsaves, card expansions, and the primary conversion event — clicking Book or Studio page.

| Event | Description | File |
|---|---|---|
| `filter_toggled` | User toggles a quick-filter chip (After work, Under $75, My favorites, etc.) | `app/components/ScheduleView.tsx` |
| `neighborhood_filter_changed` | User selects or deselects a neighborhood in the neighborhood dropdown | `app/components/ScheduleView.tsx` |
| `date_filter_changed` | User selects or deselects a date in the date dropdown | `app/components/ScheduleView.tsx` |
| `class_saved` | User saves (favorites) a workshop session by clicking the heart icon | `app/components/ScheduleView.tsx` |
| `class_unsaved` | User removes a workshop session from favorites | `app/components/ScheduleView.tsx` |
| `class_details_expanded` | User expands a workshop card to see full details | `app/components/ScheduleView.tsx` |
| `book_class_clicked` | User clicks Book or Studio page — primary conversion event | `app/components/ScheduleView.tsx` |
| `minimal_view_toggled` | User toggles compact/minimal view mode on or off | `app/components/ScheduleView.tsx` |
| `past_events_expanded` | User expands the past events section while viewing favorites | `app/components/ScheduleView.tsx` |
| `all_favorites_cleared` | User removes all saved classes via the Remove all button | `app/components/ScheduleView.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://us.posthog.com/project/386682/dashboard/1481233
- **Book class clicks over time**: https://us.posthog.com/project/386682/insights/xlXB1n43
- **Filter to booking funnel**: https://us.posthog.com/project/386682/insights/8roOTX08
- **Most used filters**: https://us.posthog.com/project/386682/insights/fZR0cB3Z
- **Classes saved vs unsaved**: https://us.posthog.com/project/386682/insights/oFrSVhHg
- **Top booked classes by category**: https://us.posthog.com/project/386682/insights/Zt4wTdlx

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
