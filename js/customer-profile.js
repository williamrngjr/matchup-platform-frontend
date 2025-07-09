document.addEventListener('DOMContentLoaded', () => {
    const editProfileForm = document.getElementById('editProfileForm');
    const nameInput = document.getElementById('name');
    const profilePictureURLInput = document.getElementById('profilePictureURL');
    const locationInput = document.getElementById('location');
    const contactNumberInput = document.getElementById('contactNumber');
    const projectPreferencesInput = document.getElementById('projectPreferences');
    const messageDiv = document.getElementById('message');
    const saveProfileButton = document.getElementById('saveProfileButton');

    let currentCustomerDocId = null;

    // Initially disable the save button to prevent premature clicks
    if (saveProfileButton) {
        saveProfileButton.disabled = true;
        saveProfileButton.textContent = 'Loading Profile...';
    }

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (!userDoc.exists || userDoc.data().userType !== 'customer') { // Check specifically for 'customer'
                alert('Access Denied. You are not authorized to edit this profile.');
                window.location.href = 'login.html';
                return;
            }

            try {
                const customerQuerySnapshot = await db.collection('customers').where('userId', '==', user.uid).limit(1).get();

                if (!customerQuerySnapshot.empty) {
                    const customerDoc = customerQuerySnapshot.docs[0];
                    currentCustomerDocId = customerDoc.id; // Store the document ID
                    const customerData = customerDoc.data();

                    // Populate form fields with existing data
                    nameInput.value = customerData.name || '';
                    profilePictureURLInput.value = customerData.profilePictureURL || '';
                    locationInput.value = customerData.location || '';
                    contactNumberInput.value = customerData.contactNumber || '';
                    projectPreferencesInput.value = customerData.projectPreferences ? customerData.projectPreferences.join(', ') : '';

                } else {
                    // Customer profile DOES NOT exist, create a new one using user.uid as the document ID
                    currentCustomerDocId = user.uid;
                    await db.collection('customers').doc(currentCustomerDocId).set({
                        userId: user.uid,
                        name: user.email.split('@')[0], // Default name
                        userType: 'customer',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        profilePictureURL: '',
                        location: '',
                        contactNumber: '',
                        projectPreferences: []
                    }, { merge: true });

                    alert('Your customer profile has been initialized! Please fill in your details.');
                    // Form fields will be empty, ready for input
                }

                // Enable the save button and update its text after profile is loaded/initialized
                if (saveProfileButton) {
                    saveProfileButton.disabled = false;
                    saveProfileButton.textContent = 'Save Profile';
                }

            } catch (error) {
                console.error('Error fetching/initializing customer profile:', error);
                messageDiv.textContent = `Error loading profile: ${error.message}`;
                // Keep button disabled on error
            }

            // --- Event Listener for Form Submission ---
            editProfileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                messageDiv.textContent = ''; // Clear previous messages

                // Re-check currentCustomerDocId right before saving (extra safeguard)
                if (!currentCustomerDocId) {
                    messageDiv.textContent = 'Error: Customer profile ID not found. Please refresh the page.';
                    console.error('Attempted to save profile when currentCustomerDocId was unexpectedly null.');
                    return;
                }

                const name = nameInput.value;
                const profilePictureURL = profilePictureURLInput.value;
                const location = locationInput.value;
                const contactNumber = contactNumberInput.value;
                const projectPreferences = projectPreferencesInput.value.split(',').map(s => s.trim()).filter(s => s !== '');

                try {
                    // Update the document using currentCustomerDocId
                    await db.collection('customers').doc(currentCustomerDocId).update({
                        name: name,
                        profilePictureURL: profilePictureURL,
                        location: location,
                        contactNumber: contactNumber,
                        projectPreferences: projectPreferences,
                        lastUpdated: firebase.firestore.FieldValue.serverTimestamp() // Add a last updated timestamp
                    });
                    alert('Profile updated successfully!');
                    window.location.href = 'customer-dashboard.html'; // Redirect to dashboard
                } catch (error) {
                    console.error('Error updating profile:', error);
                    messageDiv.textContent = `Error updating profile: ${error.message}`;
                }
            });
        } else {
            // No user is signed in.
            alert('You must be logged in to edit your profile.');
            window.location.href = 'login.html';
        }
    });
});