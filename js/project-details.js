document.addEventListener('DOMContentLoaded', () => {
    const projectTitleHeader = document.getElementById('projectTitleHeader');
    const projectDetailsContent = document.getElementById('projectDetailsContent');
    const messageDiv = document.getElementById('message');
    const dashboardLink = document.getElementById('dashboardLink');

    const proposalSection = document.getElementById('proposalSection');
    const proposalForm = document.getElementById('proposalForm');
    const bidAmountInput = document.getElementById('bidAmount');
    const proposalMessageInput = document.getElementById('proposalMessage');
    const proposalMessageDiv = document.getElementById('proposalMessageDiv');

    const viewProposalsSection = document.getElementById('viewProposalsSection');
    const proposalsList = document.getElementById('proposalsList');

    let currentProject = null; // Store fetched project data
    let currentUser = null;
    let currentUserType = null;
    let currentProjectId = null;

    // Get project ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentProjectId = urlParams.get('id');

    if (!currentProjectId) {
        projectDetailsContent.innerHTML = '<p>No project ID provided in the URL.</p>';
        projectTitleHeader.textContent = 'Project Not Found';
        return;
    }

    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            // User not logged in, but we still want to show project details (if public read is allowed)
            // Can choose to redirect to login or show limited info
            // For now, allow viewing but disable proposal submission.
            currentUser = null;
            currentUserType = null;
            dashboardLink.style.display = 'none'; // Hide dashboard link if not logged in
        } else {
            currentUser = user;
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                currentUserType = userDoc.data().userType;
                // Update dashboard link based on user type
                if (currentUserType === 'customer') {
                    dashboardLink.href = 'customer-dashboard.html';
                } else if (currentUserType === 'designer') {
                    dashboardLink.href = 'designer-dashboard.html';
                } else if (currentUserType === 'architect') {
                    dashboardLink.href = 'architect-dashboard.html';
                } else if (currentUserType === 'admin') {
                    dashboardLink.href = 'admin-dashboard.html';
                }
            }
        }

        // Fetch project details regardless of login status (assuming public read in rules)
        fetchProjectDetails();
    });

    const fetchProjectDetails = async () => {
        projectDetailsContent.innerHTML = '<p>Loading project details...</p>';
        messageDiv.textContent = '';
        projectTitleHeader.textContent = 'Loading Project...';

        try {
            const projectDoc = await db.collection('projects').doc(currentProjectId).get();

            if (projectDoc.exists) {
                currentProject = projectDoc.data();
                projectTitleHeader.textContent = currentProject.title;
                projectDetailsContent.innerHTML = `
                    <div class="detail-item"><strong>Description:</strong> ${currentProject.description}</div>
                    <div class="detail-item"><strong>Type:</strong> ${currentProject.projectType}</div>
                    <div class="detail-item"><strong>Budget:</strong> $${currentProject.budget.min} - $${currentProject.budget.max}</div>
                    <div class="detail-item"><strong>Location:</strong> ${currentProject.location}</div>
                    <div class="detail-item"><strong>Status:</strong> ${currentProject.status}</div>
                    <div class="detail-item"><strong>Posted On:</strong> ${currentProject.postedAt ? new Date(currentProject.postedAt.toDate()).toLocaleDateString() : 'N/A'}</div>
                    ${currentProject.desiredCompletionDate ? `<div class="detail-item"><strong>Desired Completion:</strong> ${new Date(currentProject.desiredCompletionDate.toDate()).toLocaleDateString()}</div>` : ''}
                `;

                // Display sections based on user type and project ownership
                if (currentUser && currentUserType) {
                    if (currentUserType === 'customer' && currentUser.uid === currentProject.customerId) {
                        // Current user is the customer who posted this project
                        viewProposalsSection.style.display = 'block';
                        fetchProposals(currentProjectId); // Load proposals for this project
                        proposalSection.style.display = 'none'; // Don't show proposal form to project owner
                    } else if (currentUserType === 'designer' || currentUserType === 'architect') {
                        // Current user is a professional
                        proposalSection.style.display = 'block';
                        viewProposalsSection.style.display = 'none'; // Professionals don't view others' proposals here
                        // Check if professional has already submitted a proposal
                        await checkIfProfessionalProposed(currentUser.uid, currentProjectId);
                    } else {
                        // Other user types (e.g., admin, or just logged in non-owner)
                        proposalSection.style.display = 'none';
                        viewProposalsSection.style.display = 'none';
                    }
                } else {
                    // Not logged in or unknown user type
                    proposalSection.style.display = 'none';
                    viewProposalsSection.style.display = 'none';
                }

            } else {
                projectDetailsContent.innerHTML = '<p>Project not found.</p>';
                projectTitleHeader.textContent = 'Project Not Found';
            }
        } catch (error) {
            console.error('Error fetching project details:', error);
            messageDiv.textContent = `Error loading project details: ${error.message}`;
            projectDetailsContent.innerHTML = '<p>Error loading project details. Please try again.</p>';
        }
    };

    // --- Proposal Submission Logic (for Professionals) ---
    proposalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        proposalMessageDiv.textContent = '';

        if (!currentUser || (currentUserType !== 'designer' && currentUserType !== 'architect')) {
            proposalMessageDiv.textContent = 'You must be logged in as a professional to submit a proposal.';
            return;
        }
        if (!currentProjectId) {
            proposalMessageDiv.textContent = 'Error: Project ID is missing.';
            return;
        }

        const bidAmount = parseFloat(bidAmountInput.value);
        const proposalMessage = proposalMessageInput.value.trim();

        if (isNaN(bidAmount) || bidAmount <= 0) {
            proposalMessageDiv.textContent = 'Please enter a valid bid amount.';
            return;
        }
        if (!proposalMessage) {
            proposalMessageDiv.textContent = 'Please enter a message for your proposal.';
            return;
        }

        try {
            // Find the professional's specific document ID (designerId or architectId)
            const professionalDocQuery = await db.collection(currentUserType + 's').where('userId', '==', currentUser.uid).limit(1).get();
            if (professionalDocQuery.empty) {
                proposalMessageDiv.textContent = `Error: Your ${currentUserType} profile not found.`;
                return;
            }
            const professionalId = professionalDocQuery.docs[0].id; // Get designer/architect doc ID

            // Add proposal to a subcollection under the project
            await db.collection('projects').doc(currentProjectId).collection('proposals').add({
                projectId: currentProjectId, // Redundant but useful for queries
                professionalId: professionalId, // The designer/architect document ID
                professionalUserId: currentUser.uid, // The Firebase Auth UID
                professionalType: currentUserType,
                bidAmount: bidAmount,
                message: proposalMessage,
                submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'pending' // Initial status
            });

            alert('Proposal submitted successfully!');
            proposalForm.reset();
            proposalSection.innerHTML = `<p>Your proposal has been submitted. Status: pending.</p>`; // Update UI to show proposal submitted
        } catch (error) {
            console.error('Error submitting proposal:', error);
            proposalMessageDiv.textContent = `Error submitting proposal: ${error.message}`;
        }
    });

    // --- Check if Professional Already Proposed ---
    const checkIfProfessionalProposed = async (professionalUserId, projectId) => {
        try {
            const proposalsSnapshot = await db.collection('projects').doc(projectId).collection('proposals')
                .where('professionalUserId', '==', professionalUserId)
                .limit(1)
                .get();

            if (!proposalsSnapshot.empty) {
                proposalSection.innerHTML = `<p>You have already submitted a proposal for this project. Status: ${proposalsSnapshot.docs[0].data().status}</p>`;
            }
        } catch (error) {
            console.error('Error checking existing proposal:', error);
            // Don't show critical error to user, just log
        }
    };


    // --- Fetch Proposals for Customer (Viewing Proposals) ---
    const fetchProposals = async (projectId) => {
        proposalsList.innerHTML = '<p>Loading proposals...</p>';
        try {
            const proposalsSnapshot = await db.collection('projects').doc(projectId).collection('proposals')
                .orderBy('submittedAt', 'asc') // Order by submission time
                .get();

            if (proposalsSnapshot.empty) {
                proposalsList.innerHTML = '<p>No proposals received yet for this project.</p>';
                return;
            }

            proposalsList.innerHTML = ''; // Clear loading message
            for (const doc of proposalsSnapshot.docs) {
                const proposal = doc.data();
                // Fetch professional's name for display
                const professionalDoc = await db.collection(proposal.professionalType + 's').doc(proposal.professionalId).get();
                const professionalName = professionalDoc.exists ? professionalDoc.data().name : 'Unknown Professional';

                const li = document.createElement('li');
                li.innerHTML = `
                    <strong>${professionalName}</strong> (${proposal.professionalType}) - Bid: $${proposal.bidAmount}<br>
                    Status: ${proposal.status}<br>
                    Message: ${proposal.message}<br>
                    <small>Submitted: ${new Date(proposal.submittedAt.toDate()).toLocaleDateString()}</small>
                    `;
                proposalsList.appendChild(li);
            }

        } catch (error) {
            console.error('Error fetching proposals:', error);
            proposalsList.innerHTML = '<p>Error loading proposals. Please try again later.</p>';
        }
    };
});