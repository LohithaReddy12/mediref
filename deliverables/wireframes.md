MedRef Annotated Wireframes

1) Dashboard (desktop)
- Topbar: profile switcher, search, notifications, avatar
- Left nav: Dashboard, Records, Timeline, Assistant, Medications, Providers, Family, Share & Export, Settings
- Main: Recent documents (cards), upcoming follow-ups (list), quick actions (Upload, Scan, Add Visit), family overview (compact)
- Right: Security & sync status, storage usage

2) Records list
- Filter chips: type, date range, provider, tag
- View toggle: list / grid
- Document card: thumb, type, date, provider, quick actions (open, share, tag)
- Multi-select bulk actions: tag, move to profile, export, delete

3) Document Viewer
- Left metadata pane: extracted fields (date, provider, type), tags, linked visit, medications
- Center viewer: PDF/image viewer with page nav, zoom, annotations
- Right AI pane: Summary (short + expanded), extracted entities (meds, labs, follow-ups), source snippets with link-to-page
- Toolbar: highlight toggle, redact, add note, share

4) Timeline
- Person selector
- Zoom controls (week/month/year)
- Events as color-coded nodes with expand-to-document

5) Assistant Workspace
- Query input (smart suggestions)
- Conversation pane: user query -> AI response cards, each card lists sources and "Mark as confirmed" or "Edit" for extracted fields
- Export/save summary button

6) Upload / Scan flow (mobile)
- Camera UI with auto-crop, enhancement
- Type suggestion after upload: (Prescription, Lab, Imaging, Visit Note)
- Confirmation & edit extracted metadata

7) Share & Consent modal
- Recipient input, scope toggles (documents, profiles), expiry, purpose, preview audit log

Design notes
- Use whitespace and calm color palette (deep teal primary, soft gold accents)
- Provide clear non-diagnostic disclaimer in assistant responses
- Show provenance with small badges linking to original doc/page
- Accessibility: full keyboard nav, focus indicators, semantic labels
