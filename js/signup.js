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
        const userType = userTypeSelect.value; // This will be 'customer', 'designer', 'architect', or 'contractor'

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
                userType: userType, // Store the selected userType
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                // Add more initial profile fields here if needed
            });

            // Redirect based on user type
            alert('Account created successfully!');
            if (userType === 'customer') {
                window.location.href = 'customer-dashboard.html';
            } else if (userType === 'designer') {
                window.location.href = 'designer-dashboard.html';
            } else if (userType === 'architect') {
                window.location.href = 'architect-dashboard.html';
            } else if (userType === 'contractor') { // <-- ADDED THIS BLOCK FOR CONTRACTORS
                window.location.href = 'contractor-dashboard.html';
            } else {
                // Fallback for any unexpected userType (should ideally not happen with select dropdown)
                window.location.href = 'login.html';
            }

        } catch (error) {
            console.error('Error signing up:', error.message);
            messageDiv.textContent = `Error: ${error.message}`;
        }
    });
});