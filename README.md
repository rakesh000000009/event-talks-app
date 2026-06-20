# BigQuery Release Notes Hub

A modern, real-time web application to track and filter Google Cloud BigQuery release notes. It fetches the live BigQuery Atom/XML feed, parses the entries, and presents them in a beautiful, responsive, and interactive dashboard.

## Features

- **Live Feed Parsing**: Fetches the official Google Cloud BigQuery release notes feed directly.
- **Dynamic Category Separation**: Automatically parses and groups release notes into categories (e.g., Features, Issues, General, Updates).
- **Search & Filter**: Real-time client-side search by keywords and filter tags/pills to quickly find relevant updates.
- **Responsive Web Interface**: Sleek, modern dashboard designed for desktop and mobile devices.
- **Easy Sharing**: Share updates directly to Twitter/X with pre-formatted text.
- **Refresh Mechanism**: On-demand feed refreshing to fetch the latest updates.

## Project Structure

```text
bq-releases-notes/
├── app.py                  # Flask backend (fetches & parses XML, provides JSON API)
├── requirements.txt        # Python dependency list
├── static/
│   ├── app.js              # Frontend logic (AJAX fetch, searching, filtering)
│   └── style.css           # Premium styles and layout
└── templates/
    └── index.html          # Main HTML dashboard template
```

## Getting Started

### Prerequisites

- Python 3.8 or higher

### Installation & Run

1. **Activate the Virtual Environment** (if not already activated):
   ```bash
   source venv/bin/activate
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the Application**:
   ```bash
   python app.py
   ```

4. **Access the Dashboard**:
   Open [http://127.0.0.1:5000](http://127.0.0.1:5000) in your web browser.
