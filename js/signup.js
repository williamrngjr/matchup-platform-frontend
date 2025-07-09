document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const userTypeSelect = document.getElementById('userType');
    const messageDiv = document.getElementById('message');

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        messageDiv.textContent = ''; // Clear previous messages

        const email = emailInput.value;
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const userType = userTypeSelect.value;

        if (password !== confirmPassword) {
            messageDiv.textContent = 'Passwords do not match.';
            return;
        }

        if (password.length < 6) {
            messageDiv.textContent = 'Password must be at least 6 characters long.';
            return;
        }

        if (userType === "") {
            messageDiv.textContent = 'Please select a user type.';
            return;
        }

        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Store additional user data in Firestore
            await db.collection('users').doc(user.uid).set({
                email: email,
                userType: userType,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                // Add more initial profile fields here
            });

            // Redirect based on user type or to a profile completion page
            alert('Account created successfully!');
            if (userType === 'customer') {
                window.location.href = 'customer-dashboard.html'; // Or 'customer-profile-setup.html'
            } else if (userType === 'designer') {
                window.location.href = 'designer-dashboard.html'; // Or 'designer-profile-setup.html'
            } else if (userType === 'architect') {
                window.location.href = 'architect-dashboard.html'; // Or 'architect-profile-setup.html'
            } else {
                window.location.href = 'login.html'; // Fallback
            }

        } catch (error) {
            console.error('Error signing up:', error.message);
            messageDiv.textContent = `Error: ${error.message}`;
        }
    });
});