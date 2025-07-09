document.addEventListener('DOMContentLoaded', async () => {
    const designerProfileDiv = document.getElementById('designerProfile');
    const messageDiv = document.getElementById('message');

    const urlParams = new URLSearchParams(window.location.search);
    const designerId = urlParams.get('id');

    if (!designerId) {
        designerProfileDiv.innerHTML = '<p>Designer ID not provided.</p>';
        return;
    }

    try {
        const docRef = db.collection('designers').doc(designerId);
        const doc = await docRef.get();

        if (doc.exists) {
            const designer = doc.data();
            designerProfileDiv.innerHTML = `
                <div class="profile-header">
                    <img src="${designer.profilePictureURL || getRandomDefaultProfilePicture()}" alt="${designer.name}" class="profile-avatar">
                    <h2>${designer.name}</h2>
                    <p>${designer.bio || 'No bio provided.'}</p>
                    <div class="rating">Rating: ${designer.averageRating || 'N/A'} (${designer.numberOfReviews || 0} reviews)</div>
                </div>
                <div class="profile-details">
                    <div class="detail-item"><strong>Specialization:</strong> ${designer.specialization ? designer.specialization.join(', ') : 'N/A'}</div>
                    <div class="detail-item"><strong>Experience:</strong> ${designer.experienceYears || 'N/A'} years</div>
                    <div class="detail-item"><strong>Location:</strong> ${designer.location || 'N/A'}</div>
                    <div class="detail-item"><strong>Hourly Rate:</strong> $${designer.hourlyRate || 'N/A'}</div>
                    <div class="detail-item"><strong>Contact:</strong> ${designer.contactEmail || 'N/A'}</div>
                    </div>
                <h3>Portfolio</h3>
                <div class="portfolio-gallery">
                    ${designer.portfolio && designer.portfolio.length > 0 ?
                        designer.portfolio.map(item => `
                            <div class="portfolio-item">
                                <img src="${item.imageURL}" alt="${item.description}">
                                <p>${item.description}</p>
                            </div>
                        `).join('')
                        : '<p>No portfolio items available.</p>'}
                </div>
                <div style="text-align: center; margin-top: 30px;">
                    <button class="button primary">Contact Designer</button>
                    </div>
            `;
        } else {
            designerProfileDiv.innerHTML = '<p>Designer not found.</p>';
        }
    } catch (error) {
        console.error('Error fetching designer profile:', error);
        messageDiv.textContent = 'Error loading designer profile. Please try again.';
        designerProfileDiv.innerHTML = '';
    }
});