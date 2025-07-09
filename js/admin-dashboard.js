document.addEventListener('DOMContentLoaded', async () => {
    const userList = document.getElementById('userList');
    const projectOversightList = document.getElementById('projectOversightList');
    const userSearchInput = document.getElementById('userSearch');
    const messageDiv = document.getElementById('message');

    // Authentication check for Admin
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (!userDoc.exists || userDoc.data().userType !== 'admin') {
                alert('Access Denied. You are not authorized to view this page.');
                window.location.href = 'login.html'; // Redirect non-admins
                return;
            }

            // Function to load and display users
            const loadUsers = async (searchTerm = '') => {
                userList.innerHTML = '<p>Loading users...</p>';
                try {
                    let usersRef = db.collection('users').orderBy('createdAt', 'desc');
                    let usersSnapshot;

                    if (searchTerm) {
                         // Firestore doesn't support "contains" for client-side queries directly.
                         // For true searching, you'd integrate with a search service like Algolia or build
                         // a Cloud Function to query by prefix for names/emails.
                         // For now, we'll fetch all and filter client-side for demonstration.
                         usersSnapshot = await usersRef.get();
                         const filteredDocs = usersSnapshot.docs.filter(doc => {
                             const userData = doc.data();
                             const lowerSearch = searchTerm.toLowerCase();
                             return (userData.email && userData.email.toLowerCase().includes(lowerSearch)) ||
                                    (userData.name && userData.name.toLowerCase().includes(lowerSearch));
                         });
                         if (filteredDocs.length === 0) {
                             userList.innerHTML = '<p>No users found matching your search.</p>';
                             return;
                         }
                         userList.innerHTML = '';
                         filteredDocs.forEach(doc => renderUserListItem(doc.data(), doc.id));

                    } else {
                        usersSnapshot = await usersRef.limit(20).get(); // Limit for performance
                        if (usersSnapshot.empty) {
                            userList.innerHTML = '<p>No users found.</p>';
                            return;
                        }
                        userList.innerHTML = '';
                        usersSnapshot.forEach(doc => renderUserListItem(doc.data(), doc.id));
                    }


                } catch (error) {
                    console.error('Error fetching users:', error);
                    messageDiv.textContent = 'Error loading users. Please try again.';
                    userList.innerHTML = '';
                }
            };

            const renderUserListItem = (userData, userId) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <strong>${userData.name || userData.email}</strong> (${userData.userType}) - ID: ${userId}
                    <button data-user-id="${userId}" class="button secondary view-user-profile-btn" style="margin-left: 10px;">View Profile</button>
                    <button data-user-id="${userId}" data-user-type="${userData.userType}" class="button primary manage-user-btn" style="background-color: #3498db; margin-left: 5px;">Manage</button>
                `;
                userList.appendChild(li);
            };

            // Function to load and display projects
            const loadProjects = async () => {
                projectOversightList.innerHTML = '<p>Loading projects...</p>';
                try {
                    const projectsSnapshot = await db.collection('projects').orderBy('postedAt', 'desc').limit(10).get();
                    if (projectsSnapshot.empty) {
                        projectOversightList.innerHTML = '<p>No projects found.</p>';
                        return;
                    }
                    projectOversightList.innerHTML = '';
                    projectsSnapshot.forEach(doc => {
                        const project = doc.data();
                        const li = document.createElement('li');
                        li.innerHTML = `
                            <strong>${project.title}</strong> - Status: ${project.status} (by ${project.customerId})
                            <button data-project-id="${doc.id}" class="button secondary view-project-btn" style="margin-left: 10px;">View</button>
                            <button data-project-id="${doc.id}" class="button primary manage-project-btn" style="background-color: #3498db; margin-left: 5px;">Manage</button>
                        `;
                        projectOversightList.appendChild(li);
                    });
                } catch (error) {
                    console.error('Error fetching projects:', error);
                    messageDiv.textContent = 'Error loading projects. Please try again.';
                    projectOversightList.innerHTML = '';
                }
            };

            // Initial loads
            loadUsers();
            loadProjects();

            // Event listeners for search
            userSearchInput.addEventListener('keyup', (e) => {
                // Debounce this in a real app for performance
                if (e.key === 'Enter' || userSearchInput.value.length >= 3 || userSearchInput.value === '') {
                    loadUsers(userSearchInput.value);
                }
            });

            // Event delegation for user and project buttons (for future implementation)
            userList.addEventListener('click', (e) => {
                if (e.target.classList.contains('view-user-profile-btn')) {
                    const userId = e.target.dataset.userId;
                    // Redirect to a generic user profile viewer or a specific one
                    console.log('View user profile for:', userId);
                    // window.location.href = `user-profile-viewer.html?id=${userId}`;
                    alert(`Viewing profile for User ID: ${userId}`);
                } else if (e.target.classList.contains('manage-user-btn')) {
                    const userId = e.target.dataset.userId;
                    const userType = e.target.dataset.userType;
                    // Implement modal or new page for user management (e.g., change user type, suspend, delete)
                    console.log('Manage user:', userId, userType);
                    alert(`Managing User ID: ${userId} (Type: ${userType}). Functionality not fully implemented.`);
                }
            });

            projectOversightList.addEventListener('click', (e) => {
                if (e.target.classList.contains('view-project-btn')) {
                    const projectId = e.target.dataset.projectId;
                    window.location.href = `project-details.html?id=${projectId}`; // Assuming you build this page
                } else if (e.target.classList.contains('manage-project-btn')) {
                    const projectId = e.target.dataset.projectId;
                    // Implement modal or new page for project management (e.g., change status, assign admin)
                    console.log('Manage project:', projectId);
                    alert(`Managing Project ID: ${projectId}. Functionality not fully implemented.`);
                }
            });

        } else {
            // No user is signed in.
            alert('You must be logged in as an administrator to view this page.');
            window.location.href = 'login.html';
        }
    });
});