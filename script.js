const supabaseUrl = 'https://itxcsjstfibaglsjdfqt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0eGNzanN0ZmliYWdsc2pkZnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMDE5MDUsImV4cCI6MjA3NzU3NzkwNX0.XaWjEhjV_PQ8-cbd4pEAfayVpr5_0tVgImZnVegyTjU';

const supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {

    console.log('DOM fully loaded and parsed');

    // Dark Mode Toggle
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
        });
    }

    // Profile Photo Management
    const profileImage = document.getElementById('profile-image');
    const uploadButton = document.getElementById('upload-button');
    const deleteButton = document.getElementById('delete-button');

    async function loadProfilePhoto() {
        console.log('loadProfilePhoto function called');
        const { data, error } = await supabase
            .from('profile')
            .select('photo_url')
            .single();

        console.log('Supabase data:', data);
        console.log('Supabase error:', error);

        const existingFallback = document.querySelector('.profile-photo-fallback');
        if (existingFallback) {
            existingFallback.remove();
        }

        if (data && data.photo_url) {
            profileImage.style.display = 'block';
            profileImage.src = data.photo_url;
        } else {
            createFallback();
        }
    }

    function createFallback() {
        console.log('createFallback function called');
        profileImage.style.display = 'none';
        const fallback = document.createElement('div');
        fallback.classList.add('profile-photo-fallback');
        fallback.textContent = 'Profile Photo';
        profileImage.parentElement.appendChild(fallback);
    }

    if (profileImage) {
        loadProfilePhoto();
    }

    if (uploadButton) {
        uploadButton.addEventListener('click', async () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.onchange = async (e) => {
                const file = e.target.files[0];
                if (file) {
                    const { data, error } = await supabase.storage
                        .from('profile-photos')
                        .upload(file.name, file, { upsert: true });

                    if (error) {
                        console.error('Error uploading photo:', error);
                        return;
                    }

                    const { data: { publicUrl } } = supabase.storage
                        .from('profile-photos')
                        .getPublicUrl(file.name);

                    const { error: dbError } = await supabase
                        .from('profile')
                        .update({ photo_url: publicUrl })
                        .eq('id', 1); // Assuming a single user profile

                    if (dbError) {
                        console.error('Error saving photo URL:', dbError);
                    } else {
                        alert('Profile photo uploaded successfully!');
                        loadProfilePhoto();
                    }
                }
            };
            fileInput.click();
        });
    }

    if (deleteButton) {
        deleteButton.addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete your profile photo?')) {
                const { data, error } = await supabase.storage
                    .from('profile-photos')
                    .remove(['YOUR_PHOTO_NAME']); // You need to get the photo name from the database

                if (error) {
                    console.error('Error deleting photo:', error);
                    return;
                }

                const { error: dbError } = await supabase
                    .from('profile')
                    .update({ photo_url: null })
                    .eq('id', 1); // Assuming a single user profile

                if (dbError) {
                    console.error('Error deleting photo URL:', dbError);
                } else {
                    alert('Profile photo deleted successfully!');
                    loadProfilePhoto();
                }
            }
        });
    }

    // Project Upload
    const projectForm = document.getElementById('project-form');

    if (projectForm) {
        projectForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const title = projectForm['project-title'].value;
            const description = projectForm['project-description'].value;
            const technologies = projectForm['project-technologies'].value;
            const imageUrl = projectForm['project-image'].value;
            const link = projectForm['project-link'].value;

            const { data, error } = await supabase
                .from('projects')
                .insert([{ title, description, technologies, imageUrl, link }]);

            if (error) {
                console.error('Error inserting project:', error);
            } else {
                projectForm.reset();
                loadProjects();
            }
        });
    }

    // Display Projects
    const projectsGallery = document.getElementById('projects-gallery');

    async function loadProjects() {
        if (projectsGallery) {
            const { data: projects, error } = await supabase
                .from('projects')
                .select('*');

            if (error) {
                console.error('Error fetching projects:', error);
                return;
            }

            projectsGallery.innerHTML = '';
            projects.forEach(project => {
                displayProject(project);
            });
        }
    }

    function displayProject(project) {
        const projectCard = `
            <div class="project-card" data-aos="fade-up">
                <img src="${project.imageUrl}" alt="${project.title}" loading="lazy">
                <h3>${project.title}</h3>
                <p>${project.description}</p>
                <p><strong>Technologies:</strong> ${project.technologies}</p>
                <a href="${project.link}" class="btn">View Project</a>
                <button class="delete-project-btn" data-id="${project.id}">Delete</button>
            </div>
        `;
        projectsGallery.innerHTML += projectCard;

        const deleteButtons = document.querySelectorAll('.delete-project-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                const projectId = e.target.dataset.id;
                const { error } = await supabase
                    .from('projects')
                    .delete()
                    .eq('id', projectId);

                if (error) {
                    console.error('Error deleting project:', error);
                } else {
                    loadProjects();
                }
            });
        });
    }

    if (projectsGallery) {
        loadProjects();
    }

    // Contact Details
    const contactDetailsContainer = document.getElementById('contact-details-container');
    const addContactForm = document.getElementById('add-contact-form');

    async function loadContactDetails() {
        if (contactDetailsContainer) {
            const { data: contacts, error } = await supabase
                .from('contacts')
                .select('*');

            if (error) {
                console.error('Error fetching contacts:', error);
                return;
            }

            contactDetailsContainer.innerHTML = '';
            contacts.forEach(contact => {
                displayContact(contact);
            });
        }
    }

    function displayContact(contact) {
        const contactCard = `
            <div class="contact-card">
                <h3>${contact.name}</h3>
                <p><a href="mailto:${contact.email}">${contact.email}</a></p>
                <p><a href="${contact.linkedin}" target="_blank">LinkedIn</a></p>
                <p><a href="${contact.github}" target="_blank">GitHub</a></p>
                <p>${contact.whatsapp}</p>
                <p><a href="${contact.custom}" target="_blank">${contact.custom}</a></p>
                <button class="delete-contact-btn" data-id="${contact.id}">Delete</button>
            </div>
        `;
        contactDetailsContainer.innerHTML += contactCard;

        const deleteButtons = document.querySelectorAll('.delete-contact-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                const contactId = e.target.dataset.id;
                const { error } = await supabase
                    .from('contacts')
                    .delete()
                    .eq('id', contactId);

                if (error) {
                    console.error('Error deleting contact:', error);
                } else {
                    loadContactDetails();
                }
            });
        });
    }

    if (addContactForm) {
        addContactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = addContactForm['contact-name'].value;
            const email = addContactForm['contact-email'].value;
            const linkedin = addContactForm['contact-linkedin'].value;
            const github = addContactForm['contact-github'].value;
            const whatsapp = addContactForm['contact-whatsapp'].value;
            const custom = addContactForm['contact-custom'].value;

            const { data, error } = await supabase
                .from('contacts')
                .insert([{ name, email, linkedin, github, whatsapp, custom }]);

            if (error) {
                console.error('Error inserting contact:', error);
            } else {
                addContactForm.reset();
                loadContactDetails();
            }
        });
    }

    if (contactDetailsContainer) {
        loadContactDetails();
    }

});