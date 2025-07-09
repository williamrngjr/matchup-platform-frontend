document.addEventListener('DOMContentLoaded', async () => {
    const designerList = document.getElementById('designerList');
    const searchDesignerName = document.getElementById('searchDesignerName');
    const filterDesignerSpecialization = document.getElementById('filterDesignerSpecialization');
    const applyFiltersButton = document.getElementById('applyFilters');
    const messageDiv = document.getElementById('message');

    const fetchDesigners = async () => {
        designerList.innerHTML = '<p>Loading designers...</p>';
        messageDiv.textContent = '';

        const nameQuery = searchDesignerName.value.toLowerCase();
        const specialization = filterDesignerSpecialization.value;

        try {
            let designersRef = db.collection('designers');

            // Note: Firestore queries have limitations on multiple range/array-contains queries.
            // For complex search, consider Algolia or a Cloud Function for indexing.
            // For now, we'll demonstrate basic filtering.

            let query = designersRef;

            if (specialization) {
                // For exact match on one specialization
                query = query.where('specialization', 'array-contains', specialization);
            }

            const snapshot = await query.get();

            if (snapshot.empty) {
                designerList.innerHTML = '<p>No designers found matching your criteria.</p>';
                return;
            }

            designerList.innerHTML = ''; // Clear loading message

            snapshot.forEach(doc => {
                const designer = doc.data();
                // Client-side filtering for name if Firestore query cannot handle it
                if (nameQuery && !designer.name.toLowerCase().includes(nameQuery)) {
                    return;
                }

                const card = document.createElement('div');
                card.classList.add('professional-card');
                card.innerHTML = `
                    <img src="${designer.profilePictureURL || 'https://via.placeholder.com/100'}" alt="${designer.name}">
                    <h3>${designer.name}</h3>
                    <p>Specialization: ${designer.specialization.join(', ')}</p>
                    <p>Experience: ${designer.experienceYears} years</p>
                    <div class="rating">Rating: ${designer.averageRating || 'N/A'} (${designer.numberOfReviews || 0} reviews)</div>
                    <a href="designer-profile.html?id=${doc.id}" class="button primary">View Profile</a>
                `;
                designerList.appendChild(card);
            });

        } catch (error) {
            console.error('Error fetching designers:', error);
            messageDiv.textContent = 'Error loading designers. Please try again.';
            designerList.innerHTML = '';
        }
    };

    applyFiltersButton.addEventListener('click', fetchDesigners);
    searchDesignerName.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            fetchDesigners();
        }
    });

    // Initial load
    fetchDesigners();
});