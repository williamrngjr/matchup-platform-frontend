document.addEventListener('DOMContentLoaded', () => {
    // Select relevant navigation elements by their specific structure or IDs
    const loginLinkLi = document.querySelector('nav ul li a[href="login.html"]')?.closest('li'); // Get the parent <li> of the Login link
    const signUpLinkLi = document.querySelector('nav ul li a[href="signup.html"]')?.closest('li'); // Get the parent <li> of the Sign Up link

    // The Dashboard and Logout links should have IDs in HTML as set in previous steps
    const dashboardLink = document.getElementById('dashboardLink');
    const logoutButton = document.getElementById('logoutButton');

    // Initial state: Hide Dashboard/Logout, Show Login/Signup (if elements exist)
    if (dashboardLink) dashboardLink.style.display = 'none';
    if (logoutButton) logoutButton.style.display = 'none';
    if (loginLinkLi) loginLinkLi.style.display = 'block'; // Ensure parent <li> is visible
    if (signUpLinkLi) signUpLinkLi.style.display = 'block'; // Ensure parent <li> is visible


    // Firebase Authentication State Observer
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // User is logged in: Hide Login/Signup, Show Dashboard/Logout
            if (loginLinkLi) loginLinkLi.style.display = 'none';
            if (signUpLinkLi) signUpLinkLi.style.display = 'none';
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
                    } else if (userType === 'contractor') {
                        dashboardLink.href = 'contractor-dashboard.html';
                    } else if (userType === 'admin') {
                        dashboardLink.href = 'admin-dashboard.html';
                    } else {
                        dashboardLink.href = 'index.html'; // Fallback if type is unknown
                    }
                }
            }

            // Set up Logout functionality
            if (logoutButton) {
                if (!logoutButton._hasClickListener) { // Prevent adding multiple listeners
                    logoutButton.addEventListener('click', async (e) => {
                        e.preventDefault();
                        try {
                            await auth.signOut();
                            alert('You have been logged out.');
                            // After logout, main.js will re-run onAuthStateChanged and show login/signup
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
            // User is logged out: Show Login/Signup, Hide Dashboard/Logout
            if (loginLinkLi) loginLinkLi.style.display = 'block';
            if (signUpLinkLi) signUpLinkLi.style.display = 'block';
            if (dashboardLink) dashboardLink.style.display = 'none';
            if (logoutButton) logoutButton.style.display = 'none';
        }
    });
});