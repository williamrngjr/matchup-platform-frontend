document.addEventListener('DOMContentLoaded', async () => {
    const architectProfileDiv = document.getElementById('architectProfile');
    const messageDiv = document.getElementById('message');

    const urlParams = new URLSearchParams(window.location.search);
    const architectId = urlParams.get('id');

    if (!architectId) {
        architectProfileDiv.innerHTML = '<p>Architect ID not provided.</p>';
        return;
    }

    try {
        const docRef = db.collection('architects').doc(architectId);
        const doc = await docRef.get();

        if (doc.exists) {
            const architect = doc.data();
            architectProfileDiv.innerHTML = `
                <div class="profile-header">
                    <img src="${architect.profilePictureURL || getRandomDefaultProfilePicture()}" alt="${architect.name}" class="profile-avatar">
                    <h2>${architect.name}</h2>
                    <p>${architect.bio || 'No bio provided.'}</p>
                    <div class="rating">Rating: ${architect.averageRating || 'N/A'} (${architect.numberOfReviews || 0} reviews)</div>
                </div>
                <div class="profile-details">
                    <div class="detail-item"><strong>Specialization:</strong> ${architect.specialization ? architect.specialization.join(', ') : 'N/A'}</div>
                    <div class="detail-item"><strong>Experience:</strong> ${architect.experienceYears || 'N/A'} years</div>
                    <div class="detail-item"><strong>Location:</strong> ${architect.location || 'N/A'}</div>
                    <div class="detail-item"><strong>Project Types:</strong> ${architect.projectTypes ? architect.projectTypes.join(', ') : 'N/A'}</div>
                    <div class="detail-item"><strong>Contact:</strong> ${architect.contactEmail || 'N/A'}</div>
                    </div>
                <h3>Portfolio</h3>
                <div class="portfolio-gallery">
                    ${architect.portfolio && architect.portfolio.length > 0 ?
                        architect.portfolio.map(item => `
                            <div class="portfolio-item">
                                <img src="${item.imageURL}" alt="${item.description}">
                                <p>${item.description}</p>
                            </div>
                        `).join('')
                        : '<p>No portfolio items available.</p>'}
                </div>
                <div style="text-align: center; margin-top: 30px;">
                    <button class="button primary">Contact Architect</button>
                </div>
            `;
        } else {
            architectProfileDiv.innerHTML = '<p>Architect not found.</p>';
        }
    } catch (error) {
        console.error('Error fetching architect profile:', error);
        messageDiv.textContent = 'Error loading architect profile. Please try again.';
        architectProfileDiv.innerHTML = '';
    }
});