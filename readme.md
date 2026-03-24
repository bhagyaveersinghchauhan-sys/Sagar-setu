# GeoNetra

GeoNetra is a hazard-awareness and community safety platform focused on faster reporting, clearer situational awareness, and easier access to safety guidance. The project combines a responsive web frontend, map-based incident tracking, a report submission workflow, and a lightweight backend for AI-assisted processing and social signal scanning.

## Project Overview

The platform is designed to help users:

- understand active hazards through a live map and dashboard
- submit hazard reports with location support and optional evidence
- review advisories and emergency preparedness content
- explore analytics around incident patterns and reporting activity

The homepage introduces the mission with a full-screen background video and quick entry points into the rest of the system. The internal pages focus on clean, readable workflows and responsive layouts.

## Features

- Full-screen responsive homepage with background video and dark overlay
- Shared navigation shell with persistent dark/light theme toggle
- Mobile-friendly sidebar that becomes a hamburger drawer on smaller screens
- Floating emergency popup with timed dismissal and quick navigation to hazard reporting
- Dashboard cards for major platform sections
- Interactive hazard reporting form with map pinning and location detection
- Live map page with hazard details panel and Social Radar trigger
- Advisories page with safety guidance, emergency kits, and contact references
- Analytics dashboard with KPI cards, charts, and recent reports table
- Profile and verification flows

## Tech Stack

- Frontend: HTML5, CSS3, Vanilla JavaScript with ES modules
- Icons: Lucide
- Mapping: Leaflet + OpenStreetMap
- Realtime data: Firebase Firestore
- Backend: Node.js + Express
- AI/social processing hooks: backend endpoints used by the reporting and map flows

## Setup Instructions

### 1. Frontend

```bash
cd combined
python -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000)

### 2. Backend

```bash
cd backend
npm install
npm start
```

If your backend features require environment variables, configure them before starting the server.

## Folder Structure

```text
backend/
  mock-reddit.json
  package.json
  server.js

combined/
  assets/
  CSS/
  HTML/
  firebase-core.js
  firebase.js
  index.html
  script.js

project-learning/
  future-features.md
  how-everything-works.md
  judges-qa.md
  project-explanation.md
  quick-revision.md
  tech-breakdown.md
```

## How The Project Works

1. Users land on the homepage and navigate to reporting, map, dashboard, analytics, or advisories.
2. Shared frontend logic renders the sidebar, handles theme state, mobile navigation, popup behavior, and common interactions.
3. Hazard reports are submitted through the reporting page with text, severity, coordinates, and optional media.
4. Firestore powers live hazard data on the map page.
5. The backend supports AI-related enhancements and social scanning workflows where enabled.

## Screenshots

- `Homepage hero` - add screenshot here
- `Dashboard` - add screenshot here
- `Map events page` - add screenshot here
- `Hazard report flow` - add screenshot here
- `Analytics dashboard` - add screenshot here
- `Advisories page` - add screenshot here

## Notes

- The `project-learning` folder is documentation-only and is intentionally not imported into the app.
- The sidebar visual treatment was preserved while the rest of the interface was made theme-aware and mobile responsive.
