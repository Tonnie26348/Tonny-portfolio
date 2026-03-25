document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed. Initializing scripts.');

    // --- DARK MODE TOGGLE ---
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark-mode');
        }
        darkModeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            if (document.body.classList.contains('dark-mode')) {
                localStorage.setItem('theme', 'dark');
            } else {
                localStorage.setItem('theme', 'light');
            }
        });
    }

    // --- PROJECT PAGE LOGIC ---
    const projectGrid = document.querySelector('.project-grid');
    if (projectGrid) {
        const filterButtons = document.querySelectorAll('.project-filter-btn');
        const searchInput = document.getElementById('project-search-input');

        function filterAndSearchProjects() {
            const activeFilterBtn = document.querySelector('.project-filter-btn.active');
            const activeFilter = activeFilterBtn ? activeFilterBtn.dataset.filter : 'all';
            const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
            
            const allCards = document.querySelectorAll('.project-card');
            allCards.forEach(card => {
                const cardCategory = card.dataset.category || 'Web Application';
                const cardTitle = (card.dataset.title || '').toLowerCase();
                const cardDescription = (card.dataset.description || '').toLowerCase();
                
                const categoryMatch = activeFilter === 'all' || cardCategory.toLowerCase() === activeFilter.toLowerCase();
                const searchMatch = cardTitle.includes(searchTerm) || cardDescription.includes(searchTerm);
                
                if (categoryMatch && searchMatch) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        }

        if (filterButtons.length > 0) {
            filterButtons.forEach(button => {
                button.addEventListener('click', () => {
                    filterButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    filterAndSearchProjects();
                });
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', filterAndSearchProjects);
        }
    }
});