document.addEventListener('DOMContentLoaded', () => {
    const postProjectForm = document.getElementById('postProjectForm');
    const messageDiv = document.getElementById('message');

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (!userDoc.exists || userDoc.data().userType !== 'customer') {
                alert('Access Denied. Only customers can post projects.');
                window.location.href = 'login.html';
                return;
            }

            postProjectForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                messageDiv.textContent = '';

                const projectTitle = document.getElementById('projectTitle').value;
                const projectDescription = document.getElementById('projectDescription').value;
                const projectType = document.getElementById('projectType').value;
                const budgetMin = parseFloat(document.getElementById('budgetMin').value) || 0;
                const budgetMax = parseFloat(document.getElementById('budgetMax').value) || 0;
                const location = document.getElementById('location').value;
                const desiredCompletionDate = document.getElementById('desiredCompletionDate').value;

                if (!projectTitle || !projectDescription || !projectType || !location) {
                    messageDiv.textContent = 'Please fill in all required fields.';
                    return;
                }

                try {
                    await db.collection('projects').add({
                        customerId: user.uid,
                        title: projectTitle,
                        description: projectDescription,
                        projectType: projectType,
                        budget: { min: budgetMin, max: budgetMax },
                        location: location,
                        desiredCompletionDate: desiredCompletionDate ? new Date(desiredCompletionDate) : null,
                        status: 'open', // Initial status
                        postedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });

                    alert('Project posted successfully!');
                    postProjectForm.reset(); // Clear form
                    window.location.href = 'customer-dashboard.html'; // Redirect to dashboard
                } catch (error) {
                    console.error('Error posting project:', error);
                    messageDiv.textContent = `Error: ${error.message}`;
                }
            });
        } else {
            alert('You must be logged in as a customer to post a project.');
            window.location.href = 'login.html';
        }
    });
});