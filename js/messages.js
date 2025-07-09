document.addEventListener('DOMContentLoaded', () => {
    const conversationList = document.getElementById('conversationList');
    const chatHeader = document.getElementById('chatHeader');
    const messagesArea = document.getElementById('messagesArea');
    const messageInput = document.getElementById('messageInput');
    const sendMessageButton = document.getElementById('sendMessageButton');
    const globalMessageDiv = document.getElementById('message');

    let currentUser = null;
    let selectedConversationId = null;
    let unsubscribeMessages = null; // To detach Firestore listener

    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            alert('You must be logged in to view messages.');
            window.location.href = 'login.html';
            return;
        }
        currentUser = user;
        loadConversations();
    });

    const loadConversations = async () => {
        conversationList.innerHTML = '<p style="padding: 15px; color: #777;">Loading conversations...</p>';
        try {
            // Get user's own profile to display their name/avatar
            const userProfileDoc = await db.collection('users').doc(currentUser.uid).get();
            const currentUserData = userProfileDoc.exists ? userProfileDoc.data() : { name: 'You', profilePictureURL: '' };

            // Fetch conversations where current user is a participant
            // This is a simplified approach; in a large app, you might have a 'conversation_participants' subcollection
            const conversationsSnapshot = await db.collection('conversations')
                .where('participants', 'array-contains', currentUser.uid)
                .orderBy('lastMessageAt', 'desc')
                .get();

            if (conversationsSnapshot.empty) {
                conversationList.innerHTML = '<p style="padding: 15px; color: #777;">No conversations yet. Start one from a professional\'s profile!</p>';
                return;
            }

            conversationList.innerHTML = '';
            for (const doc of conversationsSnapshot.docs) {
                const conversation = doc.data();
                const otherParticipantId = conversation.participants.find(pId => pId !== currentUser.uid);

                // Fetch the other participant's profile for display
                const otherParticipantDoc = await db.collection('users').doc(otherParticipantId).get();
                const otherParticipantData = otherParticipantDoc.exists ? otherParticipantDoc.data() : { name: 'Unknown User', profilePictureURL: '' };

                const li = document.createElement('li');
                li.classList.add('conversation-item');
                li.dataset.conversationId = doc.id;
                li.innerHTML = `
                    <img src="${otherParticipantData.profilePictureURL || 'https://via.placeholder.com/40'}" alt="User Avatar">
                    <div class="conversation-info">
                        <strong>${otherParticipantData.name || otherParticipantData.email.split('@')[0]}</strong>
                        <small>${conversation.lastMessage ? conversation.lastMessage.substring(0, 30) + '...' : 'No messages yet.'}</small>
                    </div>
                `;
                conversationList.appendChild(li);

                li.addEventListener('click', () => selectConversation(doc.id, otherParticipantData.name || otherParticipantData.email.split('@')[0]));
            }

        } catch (error) {
            console.error('Error loading conversations:', error);
            globalMessageDiv.textContent = 'Error loading conversations.';
            conversationList.innerHTML = '';
        }
    };

    const selectConversation = async (conversationId, chatPartnerName) => {
        if (selectedConversationId === conversationId) return; // Already selected

        // Remove active class from previous item
        const previousActive = document.querySelector('.conversation-item.active');
        if (previousActive) {
            previousActive.classList.remove('active');
        }

        // Add active class to new item
        const currentActive = document.querySelector(`.conversation-item[data-conversation-id="${conversationId}"]`);
        if (currentActive) {
            currentActive.classList.add('active');
        }

        selectedConversationId = conversationId;
        chatHeader.textContent = `Chat with ${chatPartnerName}`;
        messagesArea.innerHTML = '<p style="text-align: center; color: #777; margin-top: 50px;">Loading messages...</p>';
        messageInput.disabled = false;
        sendMessageButton.disabled = false;
        messageInput.focus();

        // Detach previous listener if any
        if (unsubscribeMessages) {
            unsubscribeMessages();
        }

        // Listen for new messages in the selected conversation
        unsubscribeMessages = db.collection('conversations').doc(conversationId).collection('messages')
            .orderBy('timestamp', 'asc')
            .onSnapshot(snapshot => {
                messagesArea.innerHTML = ''; // Clear existing messages
                if (snapshot.empty) {
                    messagesArea.innerHTML = '<p style="text-align: center; color: #777; margin-top: 50px;">No messages in this conversation yet. Say hello!</p>';
                } else {
                    snapshot.forEach(doc => {
                        const message = doc.data();
                        const isSentByMe = message.senderId === currentUser.uid;
                        const bubble = document.createElement('div');
                        bubble.classList.add('message-bubble', isSentByMe ? 'sent' : 'received');
                        const timestamp = message.timestamp ? new Date(message.timestamp.toDate()).toLocaleString() : 'N/A';
                        bubble.innerHTML = `
                            ${message.text}
                            <small>${isSentByMe ? 'You' : chatPartnerName} - ${timestamp}</small>
                        `;
                        messagesArea.appendChild(bubble);
                    });
                    // Scroll to the bottom of messages area
                    messagesArea.scrollTop = messagesArea.scrollHeight;
                }
            }, error => {
                console.error('Error listening to messages:', error);
                globalMessageDiv.textContent = 'Error loading messages.';
            });
    };

    sendMessageButton.addEventListener('click', async () => {
        const messageText = messageInput.value.trim();
        if (messageText && selectedConversationId) {
            try {
                // Add message to the subcollection
                await db.collection('conversations').doc(selectedConversationId).collection('messages').add({
                    senderId: currentUser.uid,
                    text: messageText,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Update the lastMessage and lastMessageAt in the parent conversation document
                await db.collection('conversations').doc(selectedConversationId).update({
                    lastMessage: messageText,
                    lastMessageAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                messageInput.value = ''; // Clear input
            } catch (error) {
                console.error('Error sending message:', error);
                globalMessageDiv.textContent = 'Error sending message.';
            }
        }
    });

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessageButton.click();
        }
    });

    // Handle logout listener (from js/logout.js, ensure it's loaded)
    // Note: The logout.js script is already included in the HTML.
});