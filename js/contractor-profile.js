document.addEventListener('DOMContentLoaded', async () => {
    const contractorProfileDiv = document.getElementById('contractorProfile');
    const messageDiv = document.getElementById('message');
    const contactProfessionalButton = document.getElementById('contactProfessionalButton'); // Get button element from HTML

    let currentUser = null;
    let contractorId = null; // This will be the UID of the contractor whose profile is being viewed

    // Get contractor ID from URL (e.g., ?id=someFirebaseUID)
    const urlParams = new URLSearchParams(window.location.search);
    contractorId = urlParams.get('id');

    if (!contractorId) {
        contractorProfileDiv.innerHTML = '<p>Contractor ID not provided in the URL.</p>';
        return;
    }

    // Authenticate user state for displaying the contact button
    auth.onAuthStateChanged(async (user) => {
        currentUser = user; // Set currentUser here

        if (contactProfessionalButton) { // Ensure the button element exists in the HTML
            // Check if user is logged in, and if they are a customer, AND if they are not viewing their own profile
            if (currentUser && currentUser.uid !== contractorId) {
                const userDoc = await db.collection('users').doc(currentUser.uid).get();
                if (userDoc.exists && userDoc.data().userType === 'customer') {
                    contactProfessionalButton.style.display = 'inline-block'; // Show button for customers
                } else {
                    contactProfessionalButton.style.display = 'none'; // Hide if not customer or not logged in
                }
            } else {
                contactProfessionalButton.style.display = 'none'; // Hide if not logged in, or viewing own profile
            }

            // Attach event listener to the contact button AFTER its display status is set
            // Check if the listener has already been added to prevent duplicates
            if (contactProfessionalButton._hasClickListener === undefined) {
                contactProfessionalButton.addEventListener('click', async () => {
                    if (!currentUser) {
                        alert('You must be logged in to contact a professional.');
                        window.location.href = 'login.html';
                        return;
                    }
                    if (!contractorId) {
                        alert('Error: Contractor ID not found.');
                        return;
                    }
                    if (currentUser.uid === contractorId) {
                         alert('You cannot message yourself!');
                         return;
                    }

                    try {
                        // Participants array, sorted for consistent querying
                        const participants = [currentUser.uid, contractorId].sort();

                        // Check if a conversation already exists between these two users
                        const existingConversationQuery = await db.collection('conversations')
                            .where('participants', '==', participants)
                            .limit(1)
                            .get();

                        let conversationId;
                        if (!existingConversationQuery.empty) {
                            conversationId = existingConversationQuery.docs[0].id;
                            alert('Continuing existing conversation!');
                        } else {
                            // Create a new conversation document if none exists
                            const newConversationRef = await db.collection('conversations').add({
                                participants: participants,
                                lastMessage: '',
                                lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
                                createdAt: firebase.firestore.FieldValue.serverTimestamp()
                            });
                            conversationId = newConversationRef.id;
                            alert('New conversation started!');
                        }

                        // Redirect to the messages page with the conversation ID
                        window.location.href = `messages.html?conversationId=${conversationId}`;

                    } catch (error) {
                        console.error('Error starting conversation:', error);
                        messageDiv.textContent = `Error initiating chat: ${error.message}`;
                    }
                });
                contactProfessionalButton._hasClickListener = true; // Mark listener as added
            }
        }
    });

    // Fetch and display the contractor's profile details
    try {
        const docRef = db.collection('contractors').doc(contractorId);
        const doc = await docRef.get();

        if (doc.exists) {
            const contractor = doc.data();
            contractorProfileDiv.innerHTML = `
                <div class="profile-header">
                    <img src="${contractor.profilePictureURL || 'https://via.placeholder.com/120'}" alt="${contractor.name}" class="profile-avatar">
                    <h2>${contractor.name}</h2>
                    <p>${contractor.bio || 'No bio provided.'}</p>
                    <div class="rating">Rating: ${contractor.averageRating || 'N/A'} (${contractor.numberOfReviews || 0} reviews)</div>
                </div>
                <div class="profile-details">
                    <div class="detail-item"><strong>Specialization:</strong> ${contractor.specialization ? contractor.specialization.join(', ') : 'N/A'}</div>
                    <div class="detail-item"><strong>Experience:</strong> ${contractor.experienceYears || 'N/A'} years in business</div>
                    <div class="detail-item"><strong>Location:</strong> ${contractor.location || 'N/A'}</div>
                    <div class="detail-item"><strong>Contact:</strong> ${contractor.contactEmail || 'N/A'}</div>
                </div>
                <h3>Portfolio</h3>
                <div class="portfolio-gallery">
                    ${contractor.portfolio && contractor.portfolio.length > 0 ?
                        contractor.portfolio.map(item => `
                            <div class="portfolio-item">
                                <img src="${item.imageURL}" alt="${item.description}">
                                <p>${item.description}</p>
                            </div>
                        `).join('')
                        : '<p>No portfolio items available.</p>'}
                </div>
                <div style="text-align: center; margin-top: 30px;">
                    <button id="contactProfessionalButton" class="button primary" style="${contactProfessionalButton ? contactProfessionalButton.style.display : 'none'};">Contact Contractor</button>
                </div>
            `;
        } else {
            contractorProfileDiv.innerHTML = '<p>Contractor not found.</p>';
        }
    } catch (error) {
        console.error('Error fetching contractor profile:', error);
        messageDiv.textContent = 'Error loading contractor profile. Please try again.';
        contractorProfileDiv.innerHTML = '';
    }
});