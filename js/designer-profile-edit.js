document.addEventListener('DOMContentLoaded', () => {
    const editProfileForm = document.getElementById('editProfileForm');
    const nameInput = document.getElementById('name');
    const profilePictureURLInput = document.getElementById('profilePictureURL');
    const bioInput = document.getElementById('bio');
    const specializationInput = document.getElementById('specialization');
    const experienceYearsInput = document.getElementById('experienceYears');
    const hourlyRateInput = document.getElementById('hourlyRate');
    const locationInput = document.getElementById('location');
    const portfolioItemsDiv = document.getElementById('portfolioItems');
    const addPortfolioItemButton = document.getElementById('addPortfolioItemButton');
    const messageDiv = document.getElementById('message');

    let currentDesignerDocId = null;

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (!userDoc.exists || userDoc.data().userType !== 'designer') {
                alert('Access Denied. You are not authorized to edit this profile.');
                window.location.href = 'login.html';
                return;
            }

            // Fetch existing designer profile data
            try {
                const designerQuerySnapshot = await db.collection('designers').where('userId', '==', user.uid).limit(1).get();
                if (!designerQuerySnapshot.empty) {
                    const designerDoc = designerQuerySnapshot.docs[0];
                    currentDesignerDocId = designerDoc.id;
                    const designerData = designerDoc.data();

                    nameInput.value = designerData.name || '';
                    profilePictureURLInput.value = designerData.profilePictureURL || '';
                    bioInput.value = designerData.bio || '';
                    specializationInput.value = designerData.specialization ? designerData.specialization.join(', ') : '';
                    experienceYearsInput.value = designerData.experienceYears || '';
                    hourlyRateInput.value = designerData.hourlyRate || '';
                    locationInput.value = designerData.location || '';

                    // Load portfolio items
                    if (designerData.portfolio && designerData.portfolio.length > 0) {
                        designerData.portfolio.forEach(item => addPortfolioItemField(item.imageURL, item.description));
                    }
                } else {
                    // If no designer profile exists, create a new one with basic info
                    const newDesignerRef = await db.collection('designers').add({
                        userId: user.uid,
                        name: user.email.split('@')[0], // Default name
                        userType: 'designer',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        averageRating: 0,
                        numberOfReviews: 0,
                        portfolio: []
                    });
                    currentDesignerDocId = newDesignerRef.id;
                    alert('New designer profile initialized. Please fill in your details!');
                }
            } catch (error) {
                console.error('Error fetching designer profile:', error);
                messageDiv.textContent = `Error loading profile: ${error.message}`;
            }

            addPortfolioItemButton.addEventListener('click', () => addPortfolioItemField('', ''));

            editProfileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                messageDiv.textContent = '';

                const name = nameInput.value;
                const profilePictureURL = profilePictureURLInput.value;
                const bio = bioInput.value;
                const specialization = specializationInput.value.split(',').map(s => s.trim()).filter(s => s !== '');
                const experienceYears = parseInt(experienceYearsInput.value) || 0;
                const hourlyRate = parseFloat(hourlyRateInput.value) || 0;
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
                    await db.collection('designers').doc(currentDesignerDocId).update({
                        name,
                        profilePictureURL,
                        bio,
                        specialization,
                        experienceYears,
                        hourlyRate,
                        location,
                        portfolio: portfolioItems
                    });
                    alert('Profile updated successfully!');
                    window.location.href = 'designer-dashboard.html';
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
            <input type="text" class="portfolio-image-url" value="${imageUrl}" placeholder="e.g., https://example.com/my-design.jpg">
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