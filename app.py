import xml.etree.ElementTree as ET
import urllib.request
import re
from flask import Flask, jsonify, render_template

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def parse_release_notes():
    try:
        # Fetch the feed with a standard User-Agent header
        req = urllib.request.Request(
            FEED_URL, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            xml_data = response.read()
        
        # Parse XML from the string data
        root = ET.fromstring(xml_data)
        
        # Atom feed namespace
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        entries = []
        for index, entry in enumerate(root.findall('atom:entry', ns)):
            title_elem = entry.find('atom:title', ns)
            date_str = title_elem.text.strip() if title_elem is not None else "Unknown Date"
            
            # Retrieve link URL
            link_elem = entry.find("atom:link[@rel='alternate']", ns)
            if link_elem is None:
                link_elem = entry.find("atom:link", ns)
            
            link = link_elem.attrib.get('href', '') if link_elem is not None else ''
            
            # Retrieve description / content HTML
            content_elem = entry.find('atom:content', ns)
            content_html = content_elem.text if content_elem is not None else ''
            
            if content_html:
                # BigQuery release notes contain blocks separated by h3 tags:
                # <h3>Feature</h3><p>Text...</p><h3>Issue</h3><p>Text...</p>
                parts = re.split(r'<h3[^>]*>', content_html)
                if len(parts) <= 1:
                    # No h3 markers found; treat as a single general update
                    entries.append({
                        'id': f"entry-{index}-0",
                        'date': date_str,
                        'type': 'General',
                        'content': content_html.strip(),
                        'link': link
                    })
                else:
                    for sub_idx, part in enumerate(parts[1:]):
                        if '</h3>' in part:
                            type_part, text_part = part.split('</h3>', 1)
                            entries.append({
                                'id': f"entry-{index}-{sub_idx}",
                                'date': date_str,
                                'type': type_part.strip(),
                                'content': text_part.strip(),
                                'link': link
                            })
                        else:
                            # Fallback if closing tag is missing
                            entries.append({
                                'id': f"entry-{index}-{sub_idx}",
                                'date': date_str,
                                'type': 'Update',
                                'content': part.strip(),
                                'link': link
                            })
            else:
                entries.append({
                    'id': f"entry-{index}-none",
                    'date': date_str,
                    'type': 'General',
                    'content': 'No details provided.',
                    'link': link
                })
        
        return entries
    except Exception as e:
        print(f"Error parsing release notes: {e}")
        # Return an empty list or some mock data on complete failure so backend doesn't crash
        return []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    releases = parse_release_notes()
    return jsonify(releases)

if __name__ == '__main__':
    # Using port 5000 by default for Flask
    app.run(debug=True, host='127.0.0.1', port=5000)
