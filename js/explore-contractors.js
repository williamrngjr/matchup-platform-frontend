document.addEventListener('DOMContentLoaded', async () => {
    const contractorList = document.getElementById('contractorList');
    const searchContractorName = document.getElementById('searchContractorName');
    const filterContractorSpecialization = document.getElementById('filterContractorSpecialization');
    const applyFiltersButton = document.getElementById('applyFilters');
    const messageDiv = document.getElementById('message');

    const fetchContractors = async () => {
        contractorList.innerHTML = '<p>Loading contractors...</p>';
        messageDiv.textContent = '';

        const nameQuery = searchContractorName.value.toLowerCase();
        const specialization = filterContractorSpecialization.value;

        try {
            let contractorsRef = db.collection('contractors');
            let query = contractorsRef;

            if (specialization) {
                // If filtering by specialization, use array-contains
                query = query.where('specialization', 'array-contains', specialization);
            }

            // Order by average rating and number of reviews for ranking display
            // Note: This combination of where() and orderBy() on different fields (or multiple orderBy)
            // will likely require a composite index if not already created.
            query = query.orderBy('averageRating', 'desc').orderBy('numberOfReviews', 'desc');

            const snapshot = await query.get();

            if (snapshot.empty) {
                contractorList.innerHTML = '<p>No contractors found matching your criteria.</p>';
                return;
            }

            contractorList.innerHTML = ''; // Clear loading message

            snapshot.forEach(doc => {
                const contractor = doc.data();
                // Client-side filtering for name if Firestore query cannot handle it directly due to limitations
                // or if it's combined with other clauses.
                if (nameQuery && !contractor.name.toLowerCase().includes(nameQuery)) {
                    return;
                }

                const card = document.createElement('div');
                card.classList.add('professional-card');
                card.innerHTML = `
                    <img src="${contractor.profilePictureURL || getRandomDefaultProfilePicture()}" alt="${contractor.name}">
                    <h3>${contractor.name}</h3>
                    <p>Specialization: ${contractor.specialization ? contractor.specialization.join(', ') : 'N/A'}</p>
                    <p>Experience: ${contractor.experienceYears || 'N/A'} years in business</p>
                    <div class="rating">Rating: ${contractor.averageRating || 'N/A'} (${contractor.numberOfReviews || 0} reviews)</div>
                    <a href="contractor-profile.html?id=${doc.id}" class="button primary">View Profile</a>
                `;
                contractorList.appendChild(card);
            });

        } catch (error) {
            console.error('Error fetching contractors:', error);
            // Display a user-friendly message
            messageDiv.textContent = 'Error loading contractors. Please try again.';
            contractorList.innerHTML = ''; // Clear any loading message
        }
    };

    // Event listeners for search and filter
    applyFiltersButton.addEventListener('click', fetchContractors);
    searchContractorName.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            fetchContractors();
        }
    });

    fetchContractors(); // Initial load of contractors when the page loads
});