// --- SUPABASE CLIENT SETUP ---
const supabaseUrl = 'https://itxcsjstfibaglsjdfqt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0eGNzanN0ZmliYWdsc2pkZnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMDE5MDUsImV4cCI6MjA3NzU3NzkwNX0.XaWjEhjV_PQ8-cbd4pEAfayVpr5_0tVgImZnVegyTjU';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed. Initializing scripts.');

    // --- DARK MODE TOGGLE ---
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        // Apply saved theme on load
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark-mode');
        }
        darkModeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            // Save theme preference
            if (document.body.classList.contains('dark-mode')) {
                localStorage.setItem('theme', 'dark');
            } else {
                localStorage.setItem('theme', 'light');
            }
        });
    }

    // --- PROJECT PAGE LOGIC ---
    const projectPage = document.getElementById('projects-gallery');
    if (projectPage) {
        console.log('Project page detected. Initializing project scripts.');
        const projectsGallery = document.getElementById('projects-gallery');
        const projectForm = document.getElementById('project-form');

        // Function to display a single project using the new card design
        function displayProject(project) {
            // Fallback for missing image
            const imageUrl = project.imageUrl || 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=2070&auto=format&fit=crop';
            
            const projectCard = `
                <div class="project-card" 
                     data-category="${project.category || 'web'}" 
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
                            <button class="btn-secondary project-modal-trigger">View Details</button>
                            <a href="${project.link}" target="_blank" class="btn-primary">Source <i class="ri-arrow-right-up-line"></i></a>
                            <button class="delete-project-btn" data-id="${project.id}"><i class="ri-delete-bin-line"></i></button>
                        </div>
                    </div>
                </div>
            `;
            projectsGallery.innerHTML += projectCard;
        }

        // Function to fetch and load all projects from Supabase
        async function loadProjects() {
            const { data: projects, error } = await supabase.from('projects').select('*');
            if (error) {
                console.error('Error fetching projects:', error);
                return;
            }

            projectsGallery.innerHTML = ''; // Clear existing projects
            projects.forEach(displayProject);
            
            // Re-initialize event listeners for new elements
            initializeModalTriggers(); 
            initializeDeleteButtons();
        }

        // Function to handle project submission
        projectForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;

            const title = form['project-title'].value;
            const description = form['project-description'].value;
            const category = form['project-category'].value;
            const technologies = form['project-technologies'].value;
            const projectImageFile = form['project-image'].files[0];
            const link = form['project-link'].value;

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
                .insert([{ title, description, category, technologies, imageUrl, link }]);

            if (error) {
                console.error('Error inserting project:', error);
                alert('Error adding project.');
            } else {
                form.reset();
                loadProjects(); // Refresh the project list
            }
        });

        // Function to initialize delete buttons for projects
        function initializeDeleteButtons() {
            projectsGallery.querySelectorAll('.delete-project-btn').forEach(button => {
                // Prevent multiple listeners
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
                            loadProjects(); // Refresh list
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
            const allCards = projectsGallery.querySelectorAll('.project-card');

            allCards.forEach(card => {
                const cardCategory = card.dataset.category || 'web';
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

            modalBody.innerHTML = `
                <img src="${image}" alt="${title}">
                <h2>${title}</h2>
                <div class="project-card-tags" style="margin-bottom: 1.5rem;">${tags}</div>
                <p>${description}</p>
                <a href="${sourceLink}" class="btn-primary" target="_blank">View Source <i class="ri-arrow-right-up-line"></i></a>
            `;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeModal() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }

        function initializeModalTriggers() {
            projectsGallery.querySelectorAll('.project-modal-trigger').forEach(button => {
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

        // Initial load
        loadProjects();
    }


    // --- CONTACT PAGE LOGIC ---
    const contactPage = document.getElementById('contact-details-container');
    if (contactPage) {
        console.log('Contact page detected. Initializing contact scripts.');
        const contactDetailsContainer = document.getElementById('contact-details-container');
        const addContactForm = document.getElementById('add-contact-form');

        // Function to display a single contact using the new card design
        function displayContact(contact) {
            let contactCardHTML = '<div class="contact-info-card" data-aos="fade-up">';
            
            // Delete Button
            contactCardHTML += `<button class="delete-contact-btn" data-id="${contact.id}"><i class="ri-delete-bin-line"></i></button>`;

            // Email
            if(contact.email) {
                contactCardHTML += `
                    <div class="contact-info-icon"><i class="ri-mail-send-line"></i></div>
                    <div class="contact-info-text">
                        <h3 class="contact-info-title">${contact.name || 'Email'}</h3>
                        <a href="mailto:${contact.email}" class="contact-info-link">${contact.email}</a>
                    </div>`;
            }
            // You can add more specific icons for LinkedIn, GitHub etc.
            else if(contact.linkedin) {
                 contactCardHTML += `
                    <div class="contact-info-icon"><i class="ri-linkedin-box-fill"></i></div>
                    <div class="contact-info-text">
                        <h3 class="contact-info-title">${contact.name}</h3>
                        <a href="${contact.linkedin}" target="_blank" class="contact-info-link">View LinkedIn</a>
                    </div>`;
            }
            // Add other conditions for github, whatsapp etc.

            contactCardHTML += '</div>';
            contactDetailsContainer.innerHTML += contactCardHTML;
        }

        // Function to fetch and load all contacts
        async function loadContactDetails() {
            const { data: contacts, error } = await supabase.from('contacts').select('*');
            if (error) {
                console.error('Error fetching contacts:', error);
                return;
            }
            contactDetailsContainer.innerHTML = '';
            contacts.forEach(displayContact);
            initializeContactDeleteButtons();
        }

        // Function to handle adding a new contact
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

        // Function to initialize delete buttons for contacts
        function initializeContactDeleteButtons() {
            contactDetailsContainer.querySelectorAll('.delete-contact-btn').forEach(button => {
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

        // Initial load
        loadContactDetails();
    }
});
