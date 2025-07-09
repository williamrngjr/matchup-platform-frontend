document.addEventListener('DOMContentLoaded', async () => {
    const topDesignersList = document.getElementById('topDesignersList');
    const topArchitectsList = document.getElementById('topArchitectsList');
    const messageDiv = document.getElementById('message');

    const fetchRankings = async (professionalType, listElement) => {
        listElement.innerHTML = `<p>Loading top ${professionalType}s...</p>`;
        try {
            // In a real app, you'd likely have a "rankings" collection updated by a Cloud Function
            // For simplicity, we'll fetch directly from professional collections,
            // ordering by averageRating and numberOfReviews.
            const collectionRef = db.collection(professionalType + 's'); // e.g., 'designers' or 'architects'
            const snapshot = await collectionRef
                                .where('averageRating', '>', 0) // Only show those with ratings
                                .orderBy('averageRating', 'desc')
                                .orderBy('numberOfReviews', 'desc')
                                .limit(10) // Top 10
                                .get();

            if (snapshot.empty) {
                listElement.innerHTML = `<p>No top ${professionalType}s available yet.</p>`;
                return;
            }

            listElement.innerHTML = `
                <table class="rankings-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Name</th>
                            <th>Rating</th>
                            <th>Reviews</th>
                            <th>Specialization</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            `;
            const tbody = listElement.querySelector('tbody');
            let rank = 1;
            snapshot.forEach(doc => {
                const professional = doc.data();
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${rank++}</td>
                    <td>${professional.name}</td>
                    <td>${professional.averageRating.toFixed(1)}</td>
                    <td>${professional.numberOfReviews}</td>
                    <td>${professional.specialization ? professional.specialization.join(', ') : 'N/A'}</td>
                    <td><a href="${professionalType}-profile.html?id=${doc.id}" class="button primary">View Profile</a></td>
                `;
                tbody.appendChild(tr);
            });

        } catch (error) {
            console.error(`Error fetching top ${professionalType}s:`, error);
            messageDiv.textContent = `Error loading top ${professionalType}s. Please try again.`;
            listElement.innerHTML = '';
        }
    };

    fetchRankings('designer', topDesignersList);
    fetchRankings('architect', topArchitectsList);
});