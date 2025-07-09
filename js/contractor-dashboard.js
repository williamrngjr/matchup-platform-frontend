document.addEventListener('DOMContentLoaded', async () => {
    const availableProjectsList = document.getElementById('availableProjectsList');
    const myProposalsList = document.getElementById('myProposalsList');
    const myReviewsList = document.getElementById('myReviewsList');
    const viewPublicProfileLink = document.getElementById('viewPublicProfileLink');

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (!userDoc.exists || userDoc.data().userType !== 'contractor') { // Check specifically for 'contractor'
                alert('Access Denied. You are not authorized to view this page.');
                window.location.href = 'login.html';
                return;
            }

            // Update "View Public Profile" link
            if (viewPublicProfileLink) {
                const contractorQuerySnapshot = await db.collection('contractors').where('userId', '==', user.uid).limit(1).get();
                if (!contractorQuerySnapshot.empty) {
                    const contractorId = contractorQuerySnapshot.docs[0].id;
                    viewPublicProfileLink.href = `contractor-profile.html?id=${contractorId}`;
                } else {
                    viewPublicProfileLink.href = '#';
                    viewPublicProfileLink.textContent = 'Setup Profile First'; // Prompt user
                }
            }

            // Load available projects (open projects relevant to contractors)
            availableProjectsList.innerHTML = 'Loading projects...';
            try {
                // This query requires a composite index: projects by status (== 'open') AND orderBy postedAt (desc)
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
                console.error('Error fetching available projects for contractor:', error);
                availableProjectsList.innerHTML = '<p>Error loading projects. Please try again.</p>';
            }

            myProposalsList.innerHTML = '<p>Functionality to view your proposals is not yet implemented.</p>';
            myReviewsList.innerHTML = '<p>Functionality to view your reviews is not yet implemented.</p>';

        } else {
            alert('You must be logged in as a contractor to view this page.');
            window.location.href = 'login.html';
        }
    });
});