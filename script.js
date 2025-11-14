// --- SUPABASE CLIENT SETUP ---
const supabaseUrl = 'https://itxcsjstfibaglsjdfqt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0eGNzanN0ZmliYWdsc2pkZnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMDE5MDUsImV4cCI6MjA3NzU3NzkwNX0.XaWjEhjV_PQ8-cbd4pEAfayVpr5_0tVgImZnVegyTjU';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

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
    const projectPageContainer = document.querySelector('.project-grid'); // Check for any project grid
    if (projectPageContainer) {
        console.log('Project page detected. Initializing project scripts.');

        const featuredProjectsGrid = document.querySelector('section.project-grid:first-of-type');
        const uploadedProjectsGallery = document.getElementById('projects-gallery');
        const projectForm = document.getElementById('project-form');

        // Function to display a single project using the new card design
        function displayProject(project, targetElement) {
            // Fallback for missing image
            const imageUrl = project.imageUrl || 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=2070&auto=format&fit=crop';
            
            const projectCard = `
                <div class="project-card" 
                     data-category="${project.category || 'Web Application'}" 
                     data-title="${project.title}" 
                     data-description="${project.description}"
                     data-aos="fade-up">

                    <div class="project-card-image-container">
                        <img src="${imageUrl}" alt="${project.title}">
                    </div>
                    <div class="project-card-content">
                        <div class="project-card-tags">
                            ${(project.technologies || '').split(',').map(tech => `<span class="project-card-tag">${tech.trim()}</span>`).join('')}
                        </div>
                        <h3 class="project-card-title">${project.title}</h3>
                        <p class="project-card-description">${project.description}</p>
                        <div class="project-card-buttons">
                            ${project.liveUrl ? `<a href="${project.liveUrl}" target="_blank" class="btn-secondary">Live URL <i class="ri-external-link-line"></i></a>` : ''}
                            <a href="${project.link}" target="_blank" class="btn-primary">Source <i class="ri-arrow-right-up-line"></i></a>
                            ${targetElement === uploadedProjectsGallery ? `<button class="delete-project-btn" data-id="${project.id}"><i class="ri-delete-bin-line"></i></button>` : ''}
                        </div>
                    </div>
                </div>
            `;
            targetElement.innerHTML += projectCard;
        }

        // Function to fetch and load uploaded projects from Supabase
        async function loadUploadedProjects() {
            if (!uploadedProjectsGallery) return; // Only run if the dynamic gallery exists

            const { data: projects, error } = await supabase.from('projects').select('*');
            if (error) {
                console.error('Error fetching uploaded projects:', error);
                return;
            }

            uploadedProjectsGallery.innerHTML = ''; // Clear existing projects
            projects.forEach(project => displayProject(project, uploadedProjectsGallery));
            
            initializeModalTriggers(); 
            initializeDeleteButtons();
        }

        // Function to handle project submission
        if (projectForm) {
            projectForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const form = e.target;

                const title = form['project-title'].value;
                const description = form['project-description'].value;
                const category = form['project-category'].value;
                const technologies = form['project-technologies'].value;
                const projectImageFile = form['project-image'].files[0];
                const link = form['project-link'].value;
                const liveUrl = ''; // No live URL input in form, default to empty

                let imageUrl = '';
                if (projectImageFile) {
                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('project-images')
                        .upload(`${Date.now()}_${projectImageFile.name}`, projectImageFile);

                    if (uploadError) {
                        console.error('Error uploading project image:', uploadError);
                        alert('Error uploading project image.');
                        return;
                    }
                    
                    const { data: { publicUrl } } = supabase.storage
                        .from('project-images')
                        .getPublicUrl(uploadData.path);
                    imageUrl = publicUrl;
                }

                const { data, error } = await supabase
                    .from('projects')
                    .insert([{ title, description, category, technologies, imageUrl, link, liveUrl }]);

                if (error) {
                    console.error('Error inserting project:', error);
                    alert('Error adding project.');
                } else {
                    alert('Project submitted successfully!');
                    form.reset();
                    loadUploadedProjects(); // Refresh the uploaded project list
                }
            });
        }

        // Function to initialize delete buttons for projects
        function initializeDeleteButtons() {
            if (!uploadedProjectsGallery) return;
            uploadedProjectsGallery.querySelectorAll('.delete-project-btn').forEach(button => {
                if (button.dataset.listenerAttached) return;
                button.dataset.listenerAttached = true;

                button.addEventListener('click', async (e) => {
                    const projectId = e.currentTarget.dataset.id;
                    if (confirm('Are you sure you want to delete this project?')) {
                        const { error } = await supabase.from('projects').delete().eq('id', projectId);
                        if (error) {
                            console.error('Error deleting project:', error);
                            alert('Error deleting project.');
                        } else {
                            loadUploadedProjects(); // Refresh list
                        }
                    }
                });
            });
        }

        // --- Filtering and Searching ---
        const filterButtons = document.querySelectorAll('.project-filter-btn');
        const searchInput = document.getElementById('project-search-input');

        function filterAndSearchProjects() {
            const activeFilter = document.querySelector('.project-filter-btn.active').dataset.filter;
            const searchTerm = searchInput.value.toLowerCase();
            
            // Select all project cards from both featured and uploaded sections
            const allCards = document.querySelectorAll('.project-grid .project-card');

            allCards.forEach(card => {
                const cardCategory = card.dataset.category || 'Web Application';
                const cardTitle = card.dataset.title.toLowerCase();
                const cardDescription = card.dataset.description.toLowerCase();

                const categoryMatch = activeFilter === 'all' || cardCategory.toLowerCase() === activeFilter.toLowerCase();
                const searchMatch = cardTitle.includes(searchTerm) || cardDescription.includes(searchTerm);

                if (categoryMatch && searchMatch) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        }

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                filterAndSearchProjects();
            });
        });
        searchInput.addEventListener('input', filterAndSearchProjects);

        // --- Modal Logic ---
        const modal = document.getElementById('project-modal');
        const modalBody = modal.querySelector('.project-modal-body');
        const closeModalBtn = document.getElementById('project-modal-close');

        function openModal(card) {
            const image = card.querySelector('.project-card-image-container img').src;
            const title = card.querySelector('.project-card-title').textContent;
            const tags = card.querySelector('.project-card-tags').innerHTML;
            const description = card.dataset.description; // Use full description
            const sourceLink = card.querySelector('.btn-primary').href;
            const liveUrlLink = card.querySelector('.btn-secondary') ? card.querySelector('.btn-secondary').href : null;


            modalBody.innerHTML = `
                <img src="${image}" alt="${title}">
                <h2>${title}</h2>
                <div class="project-card-tags" style="margin-bottom: 1.5rem;">${tags}</div>
                <p>${description}</p>
                <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                    ${liveUrlLink ? `<a href="${liveUrlLink}" class="btn-secondary" target="_blank">Live URL <i class="ri-external-link-line"></i></a>` : ''}
                    <a href="${sourceLink}" class="btn-primary" target="_blank">Source <i class="ri-arrow-right-up-line"></i></a>
                </div>
            `;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeModal() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }

        function initializeModalTriggers() {
            document.querySelectorAll('.project-modal-trigger').forEach(button => { // Select all triggers
                if (button.dataset.listenerAttached) return;
                button.dataset.listenerAttached = true;
                button.addEventListener('click', (e) => {
                    const card = e.target.closest('.project-card');
                    openModal(card);
                });
            });
        }

        closeModalBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

        // Initial load for uploaded projects
        loadUploadedProjects();
    }


    // --- CONTACT PAGE LOGIC ---
    const dynamicContactCardsContainer = document.getElementById('dynamic-contact-cards');
    if (dynamicContactCardsContainer) {
        console.log('Contact page detected. Initializing contact scripts.');
        const addContactForm = document.getElementById('add-contact-form');

        function displayContact(contact) {
            let iconClass = 'ri-information-line';
            let title = contact.name || 'Contact';
            let linkHtml = '';

            if (contact.email) {
                iconClass = 'ri-mail-send-line';
                linkHtml = `<a href="mailto:${contact.email}" class="contact-info-link">${contact.email}</a>`;
            } else if (contact.linkedin) {
                iconClass = 'ri-linkedin-box-fill';
                linkHtml = `<a href="${contact.linkedin}" target="_blank" class="contact-info-link">LinkedIn Profile</a>`;
            } else if (contact.github) {
                iconClass = 'ri-github-fill';
                linkHtml = `<a href="${contact.github}" target="_blank" class="contact-info-link">GitHub Profile</a>`;
            } else if (contact.whatsapp) {
                iconClass = 'ri-whatsapp-line';
                linkHtml = `<a href="https://wa.me/${contact.whatsapp}" target="_blank" class="contact-info-link">${contact.whatsapp}</a>`;
            } else if (contact.custom) {
                iconClass = 'ri-link';
                linkHtml = `<a href="${contact.custom}" target="_blank" class="contact-info-link">${contact.custom}</a>`;
            }

            const contactCard = `
                <div class="contact-info-card" data-aos="fade-up">
                    <div class="contact-info-icon"><i class="${iconClass}"></i></div>
                    <div class="contact-info-text">
                        <h3 class="contact-info-title">${title}</h3>
                        ${linkHtml}
                    </div>
                    <button class="delete-contact-btn" data-id="${contact.id}"><i class="ri-delete-bin-line"></i></button>
                </div>
            `;
            dynamicContactCardsContainer.innerHTML += contactCard;
        }

        async function loadContactDetails() {
            const { data: contacts, error } = await supabase.from('contacts').select('*');
            if (error) {
                console.error('Error fetching contacts:', error);
                return;
            }
            dynamicContactCardsContainer.innerHTML = '';
            contacts.forEach(displayContact);
            initializeContactDeleteButtons();
        }

        addContactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            const contactData = {
                name: form['contact-name'].value,
                email: form['contact-email'].value,
                linkedin: form['contact-linkedin'].value,
                github: form['contact-github'].value,
                whatsapp: form['contact-whatsapp'].value,
                custom: form['contact-custom'].value,
            };

            const { error } = await supabase.from('contacts').insert([contactData]);
            if (error) {
                console.error('Error inserting contact:', error);
                alert('Error adding contact.');
            } else {
                form.reset();
                loadContactDetails();
            }
        });

        function initializeContactDeleteButtons() {
            dynamicContactCardsContainer.querySelectorAll('.delete-contact-btn').forEach(button => {
                if (button.dataset.listenerAttached) return;
                button.dataset.listenerAttached = true;
                button.addEventListener('click', async (e) => {
                    const contactId = e.currentTarget.dataset.id;
                    if (confirm('Are you sure you want to delete this contact?')) {
                        const { error } = await supabase.from('contacts').delete().eq('id', contactId);
                        if (error) {
                            console.error('Error deleting contact:', error);
                        } else {
                            loadContactDetails();
                        }
                    }
                });
            });
        }

        loadContactDetails();
    }
});