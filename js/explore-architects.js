document.addEventListener('DOMContentLoaded', async () => {
    const architectList = document.getElementById('architectList');
    const searchArchitectName = document.getElementById('searchArchitectName');
    const filterArchitectSpecialization = document.getElementById('filterArchitectSpecialization');
    const applyFiltersButton = document.getElementById('applyFilters');
    const messageDiv = document.getElementById('message');

    const fetchArchitects = async () => {
        architectList.innerHTML = '<p>Loading architects...</p>';
        messageDiv.textContent = '';

        const nameQuery = searchArchitectName.value.toLowerCase();
        const specialization = filterArchitectSpecialization.value;

        try {
            let architectsRef = db.collection('architects');
            let query = architectsRef;

            if (specialization) {
                query = query.where('specialization', 'array-contains', specialization);
            }

            const snapshot = await query.get();

            if (snapshot.empty) {
                architectList.innerHTML = '<p>No architects found matching your criteria.</p>';
                return;
            }

            architectList.innerHTML = '';

            snapshot.forEach(doc => {
                const architect = doc.data();
                if (nameQuery && !architect.name.toLowerCase().includes(nameQuery)) {
                    return;
                }

                const card = document.createElement('div');
                card.classList.add('professional-card');
                card.innerHTML = `
                    <img src="${architect.profilePictureURL || getRandomDefaultProfilePicture()}" alt="${architect.name}">
                    <h3>${architect.name}</h3>
                    <p>Specialization: ${architect.specialization.join(', ')}</p>
                    <p>Experience: ${architect.experienceYears} years</p>
                    <div class="rating">Rating: ${architect.averageRating || 'N/A'} (${architect.numberOfReviews || 0} reviews)</div>
                    <a href="architect-profile.html?id=${doc.id}" class="button primary">View Profile</a>
                `;
                architectList.appendChild(card);
            });

        } catch (error) {
            console.error('Error fetching architects:', error);
            messageDiv.textContent = 'Error loading architects. Please try again.';
            architectList.innerHTML = '';
        }
    };

    applyFiltersButton.addEventListener('click', fetchArchitects);
    searchArchitectName.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            fetchArchitects();
        }
    });

    fetchArchitects();
});