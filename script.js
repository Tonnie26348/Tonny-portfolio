const typingText = document.querySelector('.typing-text');
const words = ['Web Designer', 'Developer', 'Cybersecurity Enthusiast'];
let wordIndex = 0;
let letterIndex = 0;
let isDeleting = false;

if (typingText) {
    function type() {
        const currentWord = words[wordIndex];
        if (isDeleting) {
            typingText.textContent = currentWord.substring(0, letterIndex - 1);
            letterIndex--;
            if (letterIndex === 0) {
                isDeleting = false;
                wordIndex = (wordIndex + 1) % words.length;
            }
        } else {
            typingText.textContent = currentWord.substring(0, letterIndex + 1);
            letterIndex++;
            if (letterIndex === currentWord.length) {
                isDeleting = true;
                setTimeout(type, 3000);
                return;
            }
        }
        setTimeout(type, 100);
    }

    type();
}

// Dark Mode Toggle
const darkModeToggle = document.getElementById('dark-mode-toggle');

darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});

// Profile Photo Upload
const uploadBtn = document.getElementById('upload-btn');
const photoUpload = document.getElementById('photo-upload');
const profileImage = document.getElementById('profile-image');
const deleteBtn = document.getElementById('delete-btn');

if (uploadBtn) {
    const profilePhotoRef = storage.ref('profile/profilePhoto.jpg');

    // Get the download URL and set it as the src of the img element
    profilePhotoRef.getDownloadURL().then(url => {
        profileImage.src = url;
    }).catch(error => {
        // Handle any errors
        console.error(error);
    });

    uploadBtn.addEventListener('click', () => {
        const file = photoUpload.files[0];
        if (file) {
            const uploadTask = profilePhotoRef.put(file);
            uploadTask.on('state_changed',
                (snapshot) => {
                    // Observe state change events suchs as progress, pause, and resume
                },
                (error) => {
                    // Handle unsuccessful uploads
                    console.error(error);
                },
                () => {
                    // Handle successful uploads on complete
                    uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                        profileImage.src = downloadURL;
                    });
                }
            );
        }
    });

    deleteBtn.addEventListener('click', () => {
        profilePhotoRef.delete().then(() => {
            // File deleted successfully
            profileImage.src = '';
        }).catch((error) => {
            // Uh-oh, an error occurred!
            console.error(error);
        });
    });
}

// Project Upload
const projectForm = document.getElementById('project-form');

if (projectForm) {
    projectForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const title = projectForm['project-title'].value;
        const description = projectForm['project-description'].value;
        const technologies = projectForm['project-technologies'].value;
        const image = projectForm['project-image'].files[0];
        const link = projectForm['project-link'].value;

        const imageRef = storage.ref(`projects/${image.name}`);
        const uploadTask = imageRef.put(image);

        uploadTask.on('state_changed',
            (snapshot) => {
                // Observe state change events suchs as progress, pause, and resume
            },
            (error) => {
                // Handle unsuccessful uploads
                console.error(error);
            },
            () => {
                // Handle successful uploads on complete
                uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                    const newProject = {
                        title,
                        description,
                        technologies,
                        imageUrl: downloadURL,
                        link
                    };

                    const newProjectKey = firebase.database().ref().child('projects').push().key;
                    const updates = {};
                    updates['/projects/' + newProjectKey] = newProject;

                    firebase.database().ref().update(updates);

                    projectForm.reset();
                });
            }
        );
    });
}

// Display Projects
const projectsGallery = document.getElementById('projects-gallery');

if (projectsGallery) {
    const projectsRef = firebase.database().ref('projects');
    let allProjects = [];

    projectsRef.on('value', (snapshot) => {
        projectsGallery.innerHTML = '';
        allProjects = [];
        snapshot.forEach((childSnapshot) => {
            const project = childSnapshot.val();
            allProjects.push(project);
            displayProject(project);
        });
    });

    function displayProject(project) {
        const projectCard = `
            <div class="project-card" data-aos="fade-up">
                <img src="${project.imageUrl}" alt="${project.title}" loading="lazy">
                <h3>${project.title}</h3>
                <p>${project.description}</p>
                <p><strong>Technologies:</strong> ${project.technologies}</p>
                <a href="${project.link}" class="btn">View Project</a>
            </div>
        `;
        projectsGallery.innerHTML += projectCard;
    }

    // Project Filtering and Search
    const searchInput = document.getElementById('search-input');
    const filterButtons = document.querySelectorAll('.filter-btn');

    searchInput.addEventListener('keyup', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredProjects = allProjects.filter(project => {
            return project.title.toLowerCase().includes(searchTerm) || project.technologies.toLowerCase().includes(searchTerm);
        });
        projectsGallery.innerHTML = '';
        filteredProjects.forEach(project => {
            displayProject(project);
        });
    });

    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const filter = e.target.dataset.filter;

            filterButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');

            if (filter === 'all') {
                projectsGallery.innerHTML = '';
                allProjects.forEach(project => {
                    displayProject(project);
                });
            } else {
                const filteredProjects = allProjects.filter(project => {
                    return project.technologies.toLowerCase().includes(filter.toLowerCase());
                });
                projectsGallery.innerHTML = '';
                filteredProjects.forEach(project => {
                    displayProject(project);
                });
            }
        });
    });
}

// CV Download Tracking
const downloadCvBtn = document.getElementById('download-cv-btn');

if (downloadCvBtn) {
    const downloadCountRef = firebase.database().ref('analytics/cvDownloads');

    downloadCvBtn.addEventListener('click', () => {
        downloadCountRef.transaction((current_value) => {
            return (current_value || 0) + 1;
        });
    });
}