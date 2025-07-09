document.addEventListener('DOMContentLoaded', () => {
    // Select relevant navigation elements
    const loginLink = document.querySelector('nav ul li a[href="login.html"]');
    const signUpLink = document.querySelector('nav ul li a[href="signup.html"]');
    const dashboardLink = document.getElementById('dashboardLink'); // Assumes an ID on dashboard link
    const logoutButton = document.getElementById('logoutButton'); // Assumes an ID on logout link

    // Hide dashboard and logout links by default, show login/signup
    // Check if elements exist before trying to manipulate them (important for pages where they might not be present, though our nav is consistent)
    if (dashboardLink) dashboardLink.style.display = 'none';
    if (logoutButton) logoutButton.style.display = 'none';
    // Ensure these are visible by default in HTML, and block makes them visible if JS is slow
    if (loginLink) loginLink.style.display = 'block';
    if (signUpLink) signUpLink.style.display = 'block';

    // Firebase Authentication State Observer
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // User is logged in
            if (loginLink) loginLink.style.display = 'none';
            if (signUpLink) signUpLink.style.display = 'none';
            if (dashboardLink) dashboardLink.style.display = 'block';
            if (logoutButton) logoutButton.style.display = 'block';

            // Dynamically set the dashboard link based on user type
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userType = userDoc.data().userType;
                if (dashboardLink) {
                    if (userType === 'customer') {
                        dashboardLink.href = 'customer-dashboard.html';
                    } else if (userType === 'designer') {
                        dashboardLink.href = 'designer-dashboard.html';
                    } else if (userType === 'architect') {
                        dashboardLink.href = 'architect-dashboard.html';
                    } else if (userType === 'contractor') { // Added Contractor
                        dashboardLink.href = 'contractor-dashboard.html';
                    } else if (userType === 'admin') {
                        dashboardLink.href = 'admin-dashboard.html';
                    } else {
                        dashboardLink.href = 'index.html'; // Fallback if type is unknown
                    }
                }
            }

            // Set up Logout functionality (now handled centrally in main.js)
            if (logoutButton) {
                // Ensure the event listener is only added once to avoid duplicates
                if (!logoutButton._hasClickListener) {
                    logoutButton.addEventListener('click', async (e) => {
                        e.preventDefault();
                        try {
                            await auth.signOut();
                            alert('You have been logged out.');
                            window.location.href = 'login.html'; // Redirect to login page
                        } catch (error) {
                            console.error('Error logging out:', error);
                            alert('Error logging out. Please try again.');
                        }
                    });
                    logoutButton._hasClickListener = true; // Mark as having listener
                }
            }

        } else {
            // User is logged out
            if (loginLink) loginLink.style.display = 'block';
            if (signUpLink) signUpLink.style.display = 'block';
            if (dashboardLink) dashboardLink.style.display = 'none';
            if (logoutButton) logoutButton.style.display = 'none';
        }
    });
});