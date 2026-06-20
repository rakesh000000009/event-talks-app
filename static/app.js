document.addEventListener('DOMContentLoaded', () => {
    // State management
    let allReleases = [];
    let activeFilter = 'all';
    let searchQuery = '';

    // DOM Elements
    const feedGrid = document.getElementById('feed-grid');
    const refreshBtn = document.getElementById('refresh-btn');
    const searchInput = document.getElementById('search-input');
    const filterPillsContainer = document.getElementById('filter-pills');
    const matchCountEl = document.getElementById('match-count');
    const totalCountEl = document.getElementById('total-count');

    // Category mappings and labels
    const categoryLabels = {
        'all': 'All Updates',
        'feature': 'Features',
        'announcement': 'Announcements',
        'issue': 'Issues',
        'deprecation': 'Deprecations',
        'others': 'Others'
    };

    // Helper: Normalize category string
    function getNormalizedCategory(type) {
        const t = type.toLowerCase();
        if (t.includes('feature')) return 'feature';
        if (t.includes('announcement')) return 'announcement';
        if (t.includes('issue')) return 'issue';
        if (t.includes('deprecation')) return 'deprecation';
        return 'others';
    }

    // Fetch data from Flask API
    async function fetchReleases() {
        showSkeletonLoader();
        refreshBtn.classList.add('spinning');
        refreshBtn.disabled = true;

        try {
            const response = await fetch('/api/releases');
            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }
            allReleases = await response.json();
            
            // Render UI
            updateFilterBadges();
            filterAndRenderReleases();
        } catch (error) {
            console.error('Error fetching release notes:', error);
            showErrorState();
        } finally {
            refreshBtn.classList.remove('spinning');
            refreshBtn.disabled = false;
        }
    }

    // Show skeletons while fetching
    function showSkeletonLoader() {
        feedGrid.innerHTML = `
            <div class="skeleton-loader">
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
            </div>
        `;
    }

    // Show error message
    function showErrorState() {
        feedGrid.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <h3>Oops! Something went wrong</h3>
                <p>We couldn't load the BigQuery release notes. Please check your network connection and try again.</p>
                <button id="retry-btn" class="refresh-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M23 4v6h-6"></path>
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                    </svg>
                    Retry
                </button>
            </div>
        `;
        document.getElementById('retry-btn')?.addEventListener('click', fetchReleases);
    }

    // Count badges on filter pills
    function updateFilterBadges() {
        const counts = {
            'all': allReleases.length,
            'feature': 0,
            'announcement': 0,
            'issue': 0,
            'deprecation': 0,
            'others': 0
        };

        allReleases.forEach(item => {
            const cat = getNormalizedCategory(item.type);
            counts[cat] = (counts[cat] || 0) + 1;
        });

        // Regenerate or update filter pills
        filterPillsContainer.innerHTML = '';
        Object.keys(categoryLabels).forEach(key => {
            const pill = document.createElement('button');
            pill.className = `filter-pill ${activeFilter === key ? 'active' : ''}`;
            pill.setAttribute('data-filter', key);
            
            const labelSpan = document.createElement('span');
            labelSpan.textContent = categoryLabels[key];
            
            const countSpan = document.createElement('span');
            countSpan.className = 'count-badge';
            countSpan.textContent = counts[key];
            
            pill.appendChild(labelSpan);
            pill.appendChild(countSpan);
            
            pill.addEventListener('click', () => {
                document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                activeFilter = key;
                filterAndRenderReleases();
            });
            
            filterPillsContainer.appendChild(pill);
        });
    }

    // Filter logic and rendering
    function filterAndRenderReleases() {
        let filtered = allReleases;

        // Apply Category Filter
        if (activeFilter !== 'all') {
            filtered = filtered.filter(item => getNormalizedCategory(item.type) === activeFilter);
        }

        // Apply Search Query Filter
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(item => {
                const titleMatch = item.date && item.date.toLowerCase().includes(query);
                const typeMatch = item.type && item.type.toLowerCase().includes(query);
                const contentMatch = item.content && item.content.toLowerCase().includes(query);
                return titleMatch || typeMatch || contentMatch;
            });
        }

        // Update counts
        matchCountEl.textContent = filtered.length;
        totalCountEl.textContent = allReleases.length;

        // Render cards
        if (filtered.length === 0) {
            renderEmptyState();
        } else {
            renderCards(filtered);
        }
    }

    // Show empty search state
    function renderEmptyState() {
        feedGrid.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <h3>No release notes match your criteria</h3>
                <p>Try resetting your filters or adjusting your search keyword.</p>
                <button id="reset-filters-btn" class="refresh-btn">Clear Filters & Search</button>
            </div>
        `;
        document.getElementById('reset-filters-btn')?.addEventListener('click', () => {
            searchInput.value = '';
            searchQuery = '';
            activeFilter = 'all';
            updateFilterBadges();
            filterAndRenderReleases();
        });
    }

    // Create cards from parsed releases
    function renderCards(items) {
        feedGrid.innerHTML = '';
        
        items.forEach((item, index) => {
            const category = getNormalizedCategory(item.type);
            const card = document.createElement('div');
            card.className = `release-card ${category}`;
            
            // Build card structure
            card.innerHTML = `
                <div class="card-header">
                    <div class="badge-and-date">
                        <span class="type-badge">${item.type}</span>
                        <span class="release-date">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            ${item.date}
                        </span>
                    </div>
                    ${item.link ? `
                        <a href="${item.link}" target="_blank" class="source-link" title="View official release page">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                        </a>
                    ` : ''}
                </div>
                <div class="card-content">
                    ${item.content}
                </div>
                <div class="card-footer">
                    <button class="tweet-btn" data-id="${item.id}">
                        <svg viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        Tweet Update
                    </button>
                </div>
            `;
            
            // Event listener for tweeting
            const tweetBtn = card.querySelector('.tweet-btn');
            tweetBtn.addEventListener('click', () => {
                tweetItem(item);
            });

            feedGrid.appendChild(card);
        });
    }

    // Handles Tweeting a specific release note
    function tweetItem(item) {
        // Strip HTML to get raw text description
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = item.content;
        
        // Enhance text extraction (e.g. spacing for list items, code blocks)
        let plainText = tempDiv.textContent || tempDiv.innerText || '';
        plainText = plainText.replace(/\s+/g, ' ').trim();

        // Prepare Tweet metadata
        const typeLabel = item.type ? `[${item.type.toUpperCase()}]` : '';
        const dateLabel = item.date ? `(${item.date})` : '';
        const hashtags = '#BigQuery #GoogleCloud';
        
        // Define target lengths (Twitter limit is 280)
        // Link wraps to 23 characters on X.
        const prefix = `BigQuery ${typeLabel} ${dateLabel}: `;
        const suffix = `\n\n${hashtags}`;
        const reservedLen = prefix.length + suffix.length + 25; // 25 for URL safety padding
        const maxTextLen = 280 - reservedLen;

        // Truncate description text if it overflows
        let textPart = plainText;
        if (textPart.length > maxTextLen) {
            textPart = textPart.substring(0, maxTextLen - 3) + '...';
        }

        // Compose the final tweet status message
        const tweetText = `${prefix}${textPart}${suffix}`;
        const tweetUrl = item.link || 'https://cloud.google.com/bigquery/docs/release-notes';

        // Direct web intent URL
        const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(tweetUrl)}`;
        window.open(intentUrl, '_blank', 'width=550,height=420');
    }

    // Event listeners
    refreshBtn.addEventListener('click', fetchReleases);
    
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        filterAndRenderReleases();
    });

    // Initial load
    fetchReleases();
});
