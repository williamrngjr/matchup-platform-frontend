document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in and is a customer
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (!userDoc.exists || userDoc.data().userType !== 'customer') {
                alert('Access Denied. You are not authorized to view this page.');
                window.location.href = 'login.html';
                return;
            }

            // Load customer's projects
            const projectsList = document.getElementById('customerProjectsList');
            projectsList.innerHTML = 'Loading projects...';

            try {
                const projectsSnapshot = await db.collection('projects')
                                                .where('customerId', '==', user.uid)
                                                .orderBy('postedAt', 'desc')
                                                .get();

                if (projectsSnapshot.empty) {
                    projectsList.innerHTML = '<p>You haven\'t posted any projects yet. <a href="post-project.html">Post a New Project</a></p>';
                } else {
                    projectsList.innerHTML = ''; // Clear loading message
                    projectsSnapshot.forEach(doc => {
                        const project = doc.data();
                        const li = document.createElement('li');
                        li.innerHTML = `
                            <strong>${project.title}</strong> - Status: ${project.status}
                            <a href="project-details.html?id=${doc.id}">View Details</a>
                        `;
                        projectsList.appendChild(li);
                    });
                }

            } catch (error) {
                console.error('Error fetching projects:', error);
                projectsList.innerHTML = '<p>Error loading projects. Please try again later.</p>';
            }

        } else {
            // No user is signed in.
            alert('You must be logged in to view this page.');
            window.location.href = 'login.html';
        }
    });
});