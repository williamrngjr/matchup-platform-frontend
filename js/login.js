document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const messageDiv = document.getElementById('message');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        messageDiv.textContent = '';

        const email = emailInput.value;
        const password = passwordInput.value;

        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Fetch user type from Firestore
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                const userType = userData.userType;

                alert('Login successful!');
                // Redirect based on user type
                if (userType === 'customer') {
                    window.location.href = 'customer-dashboard.html';
                } else if (userType === 'designer') {
                    window.location.href = 'designer-dashboard.html';
                } else if (userType === 'architect') {
                    window.location.href = 'architect-dashboard.html';
                } else if (userType === 'contractor') {
                    window.location.href = 'contractor-dashboard.html'; // Generic dashboard
                }
            } else {
                messageDiv.textContent = 'User profile not found. Please contact support.';
                await auth.signOut(); // Log out the user if profile data is missing
            }

        } catch (error) {
            console.error('Error logging in:', error.message);
            messageDiv.textContent = `Error: ${error.message}`;
        }
    });
});