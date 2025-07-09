document.addEventListener('DOMContentLoaded', async () => {
    const availableProjectsList = document.getElementById('availableProjectsList');
    const myProposalsList = document.getElementById('myProposalsList');
    const myReviewsList = document.getElementById('myReviewsList'); // For future use
    const viewPublicProfileLink = document.getElementById('viewPublicProfileLink'); // NEW

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (!userDoc.exists || userDoc.data().userType !== 'architect') { // Check specifically for 'architect'
                alert('Access Denied. You are not authorized to view this page.');
                window.location.href = 'login.html';
                return;
            }

            // Update "View Public Profile" link
            if (viewPublicProfileLink) {
                // Find the architect's specific profile document ID
                const architectQuerySnapshot = await db.collection('architects').where('userId', '==', user.uid).limit(1).get();
                if (!architectQuerySnapshot.empty) {
                    const architectId = architectQuerySnapshot.docs[0].id;
                    viewPublicProfileLink.href = `architect-profile.html?id=${architectId}`;
                } else {
                    // Fallback if architect profile not found (should be created on profile edit)
                    viewPublicProfileLink.href = '#';
                    viewPublicProfileLink.textContent = 'Setup Profile First'; // Prompt user
                }
            }

            // Load available projects (open projects relevant to architects)
            availableProjectsList.innerHTML = 'Loading projects...';
            try {
                // You might want to filter projects by projectType relevant to architects later
                const projectsSnapshot = await db.collection('projects')
                                                .where('status', '==', 'open')
                                                .orderBy('postedAt', 'desc')
                                                .get();

                if (projectsSnapshot.empty) {
                    availableProjectsList.innerHTML = '<p>No open projects available at the moment.</p>';
                } else {
                    availableProjectsList.innerHTML = '';
                    projectsSnapshot.forEach(doc => {
                        const project = doc.data();
                        const li = document.createElement('li');
                        li.innerHTML = `
                            <strong>${project.title}</strong> - Type: ${project.projectType} - Budget: $${project.budget.min} - $${project.budget.max}
                            <a href="project-details.html?id=${doc.id}" class="button primary" style="margin-left: 10px;">View Project & Bid</a>
                        `;
                        availableProjectsList.appendChild(li);
                    });
                }
            } catch (error) {
                console.error('Error fetching available projects for architect:', error);
                availableProjectsList.innerHTML = '<p>Error loading projects. Please try again.</p>';
            }

            // Load my proposals (Optional: if you implement tracking proposals)
            myProposalsList.innerHTML = '<p>Functionality to view your proposals is not yet implemented.</p>';
            // Load my reviews (Optional: if you implement review tracking)
            myReviewsList.innerHTML = '<p>Functionality to view your reviews is not yet implemented.</p>';

        } else {
            alert('You must be logged in as an architect to view this page.');
            window.location.href = 'login.html';
        }
    });
});