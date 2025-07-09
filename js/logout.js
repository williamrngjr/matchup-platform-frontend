document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
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
    }
});