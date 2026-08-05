// Screen-pop presets for the CRMs the team targets (BACKLOG.md item 5):
// HubSpot, Zoho CRM and Salesforce. Deliberately URL templates, not API
// integrations — near-zero maintenance and fully user-editable. Segments in
// UPPER-CASE (YOUR-…) must be replaced by the user with their account values;
// the options page says so next to the preset picker.
//
// Search-by-number tips baked in: Salesforce and Zoho match stored national
// formats best ({national}), HubSpot copes with E.164 ({number}). Users can
// swap placeholders freely — buildScreenPopUrl supports both.

export interface CrmPreset {
  id: string;
  label: string;
  /** A Config.screenPopUrl starting point. */
  template: string;
}

export const CRM_PRESETS: readonly CrmPreset[] = [
  {
    id: 'hubspot',
    label: 'HubSpot',
    template: 'https://app.hubspot.com/search/YOUR-PORTAL-ID?query={number}',
  },
  {
    id: 'zoho',
    label: 'Zoho CRM',
    template: 'https://crm.zoho.eu/crm/search?searchword={national}',
  },
  {
    id: 'salesforce',
    label: 'Salesforce (Lightning)',
    template: 'https://YOUR-DOMAIN.lightning.force.com/lightning/search/all?searchTerm={national}',
  },
];

export function presetById(id: string): CrmPreset | undefined {
  return CRM_PRESETS.find((p) => p.id === id);
}
