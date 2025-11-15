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

    // --- PROFILE PHOTO MANAGEMENT (WORKAROUND - Buttons only) ---
    const uploadButton = document.getElementById('upload-button');
    const deleteButton = document.getElementById('delete-button');

    if (uploadButton) {
        uploadButton.addEventListener('click', () => {
            alert('Upload functionality is temporarily disabled due to a Supabase security policy issue.');
        });
    }

    if (deleteButton) {
        deleteButton.addEventListener('click', () => {
            alert('Delete functionality is temporarily disabled due to a Supabase security policy issue.');
        });
    }
    

    // --- PROJECT PAGE LOGIC ---
    const projectPageContainer = document.querySelector('.project-grid');
    if (projectPageContainer) {
        console.log('Project page detected. Initializing project scripts.');

        const uploadedProjectsGallery = document.getElementById('projects-gallery');
        const projectForm = document.getElementById('project-form');

        function displayProject(project, targetElement) {
            const imageUrl = project.imageUrl || 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=2070&auto=format&fit=crop';
            const projectCard = `
                <div class="project-card" data-category="${project.category || 'Web Application'}" data-title="${project.title}" data-description="${project.description}" data-aos="fade-up">
                    <div class="project-card-image-container"><img src="${imageUrl}" alt="${project.title}"></div>
                    <div class="project-card-content">
                        <div class="project-card-tags">${(project.technologies || '').split(',').map(tech => `<span class="project-card-tag">${tech.trim()}</span>`).join('')}</div>
                        <h3 class="project-card-title">${project.title}</h3>
                        <p class="project-card-description">${project.description}</p>
                        <div class="project-card-buttons">
                            ${project.liveUrl ? `<a href="${project.liveUrl}" target="_blank" class="btn-secondary">Live URL <i class="ri-external-link-line"></i></a>` : ''}
                            <a href="${project.link}" target="_blank" class="btn-primary">Source <i class="ri-arrow-right-up-line"></i></a>
                            ${targetElement === uploadedProjectsGallery ? `<button class="delete-project-btn" data-id="${project.id}"><i class="ri-delete-bin-line"></i></button>` : ''}
                        </div>
                    </div>
                </div>`;
            targetElement.innerHTML += projectCard;
        }

        async function loadUploadedProjects() {
            if (!uploadedProjectsGallery) return;
            const { data: projects, error } = await supabase.from('projects').select('*');
            if (error) {
                console.error('Error fetching uploaded projects:', error);
                return;
            }
            uploadedProjectsGallery.innerHTML = '';
            projects.forEach(project => displayProject(project, uploadedProjectsGallery));
            initializeDeleteButtons();
        }

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
                let imageUrl = '';
                if (projectImageFile) {
                    const { data: uploadData, error: uploadError } = await supabase.storage.from('project-images').upload(`${Date.now()}_${projectImageFile.name}`, projectImageFile);
                    if (uploadError) {
                        console.error('Error uploading project image:', uploadError);
                        alert('Error uploading project image.');
                        return;
                    }
                    const { data: { publicUrl } } = supabase.storage.from('project-images').getPublicUrl(uploadData.path);
                    imageUrl = publicUrl;
                }
                const { data, error } = await supabase.from('projects').insert([{ title, description, category, technologies, imageUrl, link, liveUrl: '' }]);
                if (error) {
                    console.error('Error inserting project:', error);
                    alert('Error adding project.');
                } else {
                    alert('Project submitted successfully!');
                    form.reset();
                    loadUploadedProjects();
                }
            });
        }

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
                            loadUploadedProjects();
                        }
                    }
                });
            });
        }

        const filterButtons = document.querySelectorAll('.project-filter-btn');
        const searchInput = document.getElementById('project-search-input');
        function filterAndSearchProjects() {
            const activeFilter = document.querySelector('.project-filter-btn.active').dataset.filter;
            const searchTerm = searchInput.value.toLowerCase();
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
                </div>`;
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