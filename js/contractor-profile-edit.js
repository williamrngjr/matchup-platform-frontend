document.addEventListener('DOMContentLoaded', () => {
    const editProfileForm = document.getElementById('editProfileForm');
    const nameInput = document.getElementById('name');
    const profilePictureURLInput = document.getElementById('profilePictureURL');
    const bioInput = document.getElementById('bio');
    const specializationInput = document.getElementById('specialization');
    const experienceYearsInput = document.getElementById('experienceYears');
    const locationInput = document.getElementById('location');
    const portfolioItemsDiv = document.getElementById('portfolioItems');
    const addPortfolioItemButton = document.getElementById('addPortfolioItemButton');
    const messageDiv = document.getElementById('message');
    const saveProfileButton = editProfileForm.querySelector('button[type="submit"]'); // Get the submit button

    let currentContractorDocId = null; // This will store the Firestore document ID for the contractor

    // Initially disable the save button to prevent premature clicks
    if (saveProfileButton) {
        saveProfileButton.disabled = true;
        saveProfileButton.textContent = 'Loading Profile...';
    }

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (!userDoc.exists || userDoc.data().userType !== 'contractor') {
                alert('Access Denied. You are not authorized to edit this profile.');
                window.location.href = 'login.html';
                return;
            }

            try {
                const contractorQuerySnapshot = await db.collection('contractors').where('userId', '==', user.uid).limit(1).get();

                if (!contractorQuerySnapshot.empty) {
                    const contractorDoc = contractorQuerySnapshot.docs[0];
                    currentContractorDocId = contractorDoc.id; // Store the document ID
                    const contractorData = contractorDoc.data();

                    // Populate form fields with existing data
                    nameInput.value = contractorData.name || '';
                    profilePictureURLInput.value = contractorData.profilePictureURL || '';
                    bioInput.value = contractorData.bio || '';
                    specializationInput.value = contractorData.specialization ? contractorData.specialization.join(', ') : '';
                    experienceYearsInput.value = contractorData.experienceYears || '';
                    locationInput.value = contractorData.location || '';

                    // Load portfolio items
                    if (contractorData.portfolio && contractorData.portfolio.length > 0) {
                        contractorData.portfolio.forEach(item => addPortfolioItemField(item.imageURL, item.description));
                    }
                } else {
                    // Contractor profile DOES NOT exist, create a new one using user.uid as the document ID
                    currentContractorDocId = user.uid;
                    await db.collection('contractors').doc(currentContractorDocId).set({
                        userId: user.uid,
                        name: user.email.split('@')[0], // Default name
                        userType: 'contractor',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        averageRating: 0,
                        numberOfReviews: 0,
                        portfolio: []
                    }, { merge: true });

                    alert('Your contractor profile has been initialized! Please fill in your details.');
                    // Form fields will be empty, ready for input
                }

                // Enable the save button and update its text after profile is loaded/initialized
                if (saveProfileButton) {
                    saveProfileButton.disabled = false;
                    saveProfileButton.textContent = 'Save Profile';
                }

            } catch (error) {
                console.error('Error fetching/initializing contractor profile:', error);
                messageDiv.textContent = `Error loading profile: ${error.message}`;
                // Keep button disabled on error
            }

            // --- Event Listeners (ensure these are set up only once) ---
            addPortfolioItemButton.addEventListener('click', () => addPortfolioItemField('', ''));

            editProfileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                messageDiv.textContent = ''; // Clear previous messages

                // Re-check currentContractorDocId right before saving (extra safeguard)
                if (!currentContractorDocId) {
                    messageDiv.textContent = 'Error: Contractor profile ID not found. Please refresh the page.';
                    console.error('Attempted to save profile when currentContractorDocId was unexpectedly null.');
                    return;
                }

                const name = nameInput.value;
                const profilePictureURL = profilePictureURLInput.value;
                const bio = bioInput.value;
                const specialization = specializationInput.value.split(',').map(s => s.trim()).filter(s => s !== '');
                const experienceYears = parseInt(experienceYearsInput.value) || 0;
                const location = locationInput.value;

                const portfolioItems = [];
                document.querySelectorAll('.portfolio-item-group').forEach(group => {
                    const imgUrl = group.querySelector('.portfolio-image-url').value;
                    const desc = group.querySelector('.portfolio-description').value;
                    if (imgUrl) { // Only add if image URL is provided
                        portfolioItems.push({ imageURL: imgUrl, description: desc });
                    }
                });

                try {
                    // Update the document using currentContractorDocId
                    await db.collection('contractors').doc(currentContractorDocId).update({
                        name: name,
                        profilePictureURL: profilePictureURL,
                        bio: bio,
                        specialization: specialization,
                        experienceYears: experienceYears,
                        location: location,
                        portfolio: portfolioItems,
                        lastUpdated: firebase.firestore.FieldValue.serverTimestamp() // Add a last updated timestamp
                    });
                    alert('Profile updated successfully!');
                    window.location.href = 'contractor-dashboard.html'; // Redirect to dashboard
                } catch (error) {
                    console.error('Error updating profile:', error);
                    messageDiv.textContent = `Error updating profile: ${error.message}`;
                }
            });
        } else {
            // No user is signed in.
            alert('You must be logged in to edit your profile.');
            window.location.href = 'login.html';
        }
    });

    // Function to add a portfolio item field set
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