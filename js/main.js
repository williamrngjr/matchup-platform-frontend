document.addEventListener('DOMContentLoaded', () => {
    // Select relevant navigation elements by their specific structure or IDs
    // We target the parent <li> element to hide/show them cleanly
    const loginLinkLi = document.querySelector('nav ul li a[href="login.html"]')?.closest('li');
    const signUpLinkLi = document.querySelector('nav ul li a[href="signup.html"]')?.closest('li');

    // These elements should have IDs in your HTML navigation bar
    const dashboardLink = document.getElementById('dashboardLink');
    const logoutButton = document.getElementById('logoutButton');

    // Initial state: Hide Dashboard/Logout, Show Login/Signup (if elements exist)
    // This ensures correct state even before auth state is fully resolved by Firebase
    if (dashboardLink) dashboardLink.style.display = 'none';
    if (logoutButton) logoutButton.style.display = 'none';
    if (loginLinkLi) loginLinkLi.style.display = 'block'; // Ensure parent <li> is visible
    if (signUpLinkLi) signUpLinkLi.style.display = 'block'; // Ensure parent <li> is visible


    // Firebase Authentication State Observer
    // This listener runs every time the authentication state changes (login, logout, page load)
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // User is logged in: Hide Login/Signup, Show Dashboard/Logout
            if (loginLinkLi) loginLinkLi.style.display = 'none';
            if (signUpLinkLi) signUpLinkLi.style.display = 'none';
            if (dashboardLink) dashboardLink.style.display = 'inline';
            if (logoutButton) logoutButton.style.display = 'inline';

            // Dynamically set the dashboard link based on user type from Firestore
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userType = userDoc.data().userType;
                if (dashboardLink) { // Ensure the dashboardLink element exists on the page
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
                        dashboardLink.href = 'index.html'; // Fallback for unknown user types
                    }
                }
            }

            // Set up Logout functionality (only once to avoid multiple event listeners)
            if (logoutButton) {
                // Check if an event listener has already been attached (using a custom property)
                if (!logoutButton._hasClickListener) {
                    logoutButton.addEventListener('click', async (e) => {
                        e.preventDefault(); // Prevent default link behavior
                        try {
                            await auth.signOut(); // Perform Firebase logout
                            alert('You have been logged out.');
                            // Redirect to login page after successful logout
                            window.location.href = 'login.html';
                        } catch (error) {
                            console.error('Error logging out:', error);
                            alert('Error logging out. Please try again.');
                        }
                    });
                    logoutButton._hasClickListener = true; // Mark that listener is attached
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

const DEFAULT_PROFILE_PICTURES = [
    'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', // Generic user avatar
    'https://cdn-icons-png.flaticon.com/512/1998/1998637.png', // Cute cat avatar
    'https://cdn-icons-png.flaticon.com/512/1998/1998708.png', // Cute dog avatar
    'https://cdn-icons-png.flaticon.com/512/1998/1998703.png', // Cute owl avatar
    'https://cdn-icons-png.flaticon.com/512/1998/1998711.png'  // Cute fox avatar
];

// Function to get a random default image
function getRandomDefaultProfilePicture() {
    const randomIndex = Math.floor(Math.random() * DEFAULT_PROFILE_PICTURES.length);
    return DEFAULT_PROFILE_PICTURES[randomIndex];
}