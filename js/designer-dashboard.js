document.addEventListener('DOMContentLoaded', async () => {
    const availableProjectsList = document.getElementById('availableProjectsList');
    const myProposalsList = document.getElementById('myProposalsList');

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (!userDoc.exists || (userDoc.data().userType !== 'designer' && userDoc.data().userType !== 'architect')) {
                alert('Access Denied. You are not authorized to view this page.');
                window.location.href = 'login.html';
                return;
            }

            // Update "View Public Profile" link
            const viewPublicProfileLink = document.querySelector('a[href*="YOUR_DESIGNER_ID"]');
            if (viewPublicProfileLink) {
                // Assuming designerId is same as userId for simplicity, or fetch from 'designers' collection
                const professionalDoc = await db.collection(userDoc.data().userType + 's').where('userId', '==', user.uid).get();
                if (!professionalDoc.empty) {
                    const professionalId = professionalDoc.docs[0].id;
                    viewPublicProfileLink.href = `${userDoc.data().userType}-profile.html?id=${professionalId}`;
                }
            }


            // Load available projects (open projects)
            availableProjectsList.innerHTML = 'Loading projects...';
            try {
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
                            <strong>${project.title}</strong> - Budget: $${project.budget.min} - $${project.budget.max}
                            <a href="project-details.html?id=${doc.id}" class="button primary">View Project & Bid</a>
                        `;
                        availableProjectsList.appendChild(li);
                    });
                }
            } catch (error) {
                console.error('Error fetching available projects:', error);
                availableProjectsList.innerHTML = '<p>Error loading projects.</p>';
            }

            // Load my proposals (Optional: if you implement bidding)
            myProposalsList.innerHTML = '<p>Functionality for proposals not yet implemented in this example.</p>';

        } else {
            alert('You must be logged in to view this page.');
            window.location.href = 'login.html';
        }
    });
});