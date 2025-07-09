document.addEventListener('DOMContentLoaded', () => {
    const editProfileForm = document.getElementById('editProfileForm');
    const nameInput = document.getElementById('name');
    const profilePictureURLInput = document.getElementById('profilePictureURL');
    const bioInput = document.getElementById('bio');
    const specializationInput = document.getElementById('specialization');
    const experienceYearsInput = document.getElementById('experienceYears');
    const projectTypesInput = document.getElementById('projectTypes'); // NEW for architects
    const locationInput = document.getElementById('location');
    const portfolioItemsDiv = document.getElementById('portfolioItems');
    const addPortfolioItemButton = document.getElementById('addPortfolioItemButton');
    const messageDiv = document.getElementById('message');

    let currentArchitectDocId = null;

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (!userDoc.exists || userDoc.data().userType !== 'architect') { // Check specifically for 'architect'
                alert('Access Denied. You are not authorized to edit this profile.');
                window.location.href = 'login.html';
                return;
            }

            try {
                const architectQuerySnapshot = await db.collection('architects').where('userId', '==', user.uid).limit(1).get();

                if (!architectQuerySnapshot.empty) {
                    const architectDoc = architectQuerySnapshot.docs[0];
                    currentArchitectDocId = architectDoc.id;
                    const architectData = architectDoc.data();

                    nameInput.value = architectData.name || '';
                    profilePictureURLInput.value = architectData.profilePictureURL || '';
                    bioInput.value = architectData.bio || '';
                    specializationInput.value = architectData.specialization ? architectData.specialization.join(', ') : '';
                    experienceYearsInput.value = architectData.experienceYears || '';
                    projectTypesInput.value = architectData.projectTypes ? architectData.projectTypes.join(', ') : ''; // NEW
                    locationInput.value = architectData.location || '';

                    if (architectData.portfolio && architectData.portfolio.length > 0) {
                        architectData.portfolio.forEach(item => addPortfolioItemField(item.imageURL, item.description));
                    }
                } else {
                    currentArchitectDocId = user.uid; // Use UID as doc ID for easy lookup
                    await db.collection('architects').doc(currentArchitectDocId).set({
                        userId: user.uid,
                        name: user.email.split('@')[0],
                        userType: 'architect',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        averageRating: 0,
                        numberOfReviews: 0,
                        portfolio: []
                    }, { merge: true });

                    alert('Your architect profile has been initialized! Please fill in your details.');
                }
            } catch (error) {
                console.error('Error fetching/initializing architect profile:', error);
                messageDiv.textContent = `Error loading profile: ${error.message}`;
            }

            addPortfolioItemButton.addEventListener('click', () => addPortfolioItemField('', ''));

            editProfileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                messageDiv.textContent = '';

                if (!currentArchitectDocId) {
                    messageDiv.textContent = 'Error: Architect profile ID not found. Please refresh the page.';
                    console.error('Attempted to save profile before currentArchitectDocId was set.');
                    return;
                }

                const name = nameInput.value;
                const profilePictureURL = profilePictureURLInput.value;
                const bio = bioInput.value;
                const specialization = specializationInput.value.split(',').map(s => s.trim()).filter(s => s !== '');
                const experienceYears = parseInt(experienceYearsInput.value) || 0;
                const projectTypes = projectTypesInput.value.split(',').map(s => s.trim()).filter(s => s !== ''); // NEW
                const location = locationInput.value;

                const portfolioItems = [];
                document.querySelectorAll('.portfolio-item-group').forEach(group => {
                    const imgUrl = group.querySelector('.portfolio-image-url').value;
                    const desc = group.querySelector('.portfolio-description').value;
                    if (imgUrl) {
                        portfolioItems.push({ imageURL: imgUrl, description: desc });
                    }
                });

                try {
                    await db.collection('architects').doc(currentArchitectDocId).update({
                        name: name,
                        profilePictureURL: profilePictureURL,
                        bio: bio,
                        specialization: specialization,
                        experienceYears: experienceYears,
                        projectTypes: projectTypes, // NEW
                        location: location,
                        portfolio: portfolioItems,
                        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    alert('Profile updated successfully!');
                    window.location.href = 'architect-dashboard.html';
                } catch (error) {
                    console.error('Error updating profile:', error);
                    messageDiv.textContent = `Error updating profile: ${error.message}`;
                }
            });
        } else {
            alert('You must be logged in to edit your profile.');
            window.location.href = 'login.html';
        }
    });

    function addPortfolioItemField(imageUrl = '', description = '') {
        const group = document.createElement('div');
        group.classList.add('form-group', 'portfolio-item-group');
        group.style.border = '1px solid #eee';
        group.style.padding = '15px';
        group.style.marginBottom = '15px';
        group.innerHTML = `
            <label>Image URL:</label>
            <input type="text" class="portfolio-image-url" value="${imageUrl}" placeholder="e.g., https://example.com/my-project.jpg">
            <label style="margin-top: 10px;">Description:</label>
            <input type="text" class="portfolio-description" value="${description}" placeholder="A brief description of this project">
            <button type="button" class="button secondary remove-portfolio-item" style="margin-top: 10px; background-color: #e74c3c; color: white;">Remove</button>
        `;
        portfolioItemsDiv.appendChild(group);

        group.querySelector('.remove-portfolio-item').addEventListener('click', () => {
            group.remove();
        });
    }
});