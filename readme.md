# GeoNetra - Safety Network

GeoNetra is a real-time safety and hazard monitoring platform that connects citizens and authorities through hazard reporting, live mapping, analytics, and local advisories.

## Features

- **Real-time Hazard Network**: Visualize coastal alerts, flood warnings, heat waves, and high-wave incidents on an interactive live map.
- **Reporting System**: Submit on-the-ground reports quickly with location detection and guided verification.
- **Live Stats Dashboard**: Track active reports, alerts, and platform activity from a unified dashboard.
- **Analytics and Advisories**: Review hazard trends and safety guidance from dedicated pages.
- **Dynamic Interface**: Use a consistent shared sidebar, responsive layouts, and page-specific interactions.

## Technologies Used

- **Frontend**: HTML5, Vanilla JavaScript (ES Modules), CSS3
- **Mapping and GIS**: [Leaflet](https://leafletjs.com/) with OpenStreetMap tiles
- **Database**: Firebase Firestore for live hazard data
- **Backend**: Node.js and Express for AI summary and social scanning APIs
- **Icons**: [Lucide Icons](https://lucide.dev/)

## Folder Structure

```text
combined/
|-- HTML/          # Dashboard, analytics, advisories, reporting, map, and profile pages
|-- CSS/           # Shared and page-specific styles
|-- assets/        # Images and visual resources
|-- index.html     # Main landing page for GeoNetra
|-- script.js      # Shared UI logic, routing helpers, and map behavior
|-- firebase-core.js
`-- firebase.js    # Hazard submission and Firestore integration

backend/
|-- server.js      # Express API for AI summary generation and social scanning
`-- mock-reddit.json
```

## Setup and Running Locally

1. Serve the frontend from the `combined` directory.
2. Start the backend from the `backend` directory if you want AI summary generation and social scanning.

```bash
# Frontend
cd combined
python -m http.server 8000

# Backend
cd ../backend
npm install
npm start
```

Visit `http://localhost:8000` to interact with GeoNetra.

## Notes

- `firebase.js` and `firebase-core.js` handle the live Firestore integration used by the hazard reporting and map pages.
- The backend expects `GEMINI_API_KEY` in `backend/.env` for AI-powered summary generation and Reddit hazard scanning.

## Goal

GeoNetra is designed to help communities act faster, report better, and stay safer during environmental emergencies.
