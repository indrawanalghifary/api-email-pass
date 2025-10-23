document.addEventListener('DOMContentLoaded', () => {
    const adminUsernameInput = document.getElementById('admin-username');
    const adminPasswordInput = document.getElementById('admin-password');
    const loginButton = document.getElementById('login-button');
    const authMessage = document.getElementById('auth-message');
    const authSection = document.getElementById('auth-section');
    const adminSection = document.getElementById('admin-section');
    const generateTokenButton = document.getElementById('generate-token-button');
    const generateTokenMessage = document.getElementById('generate-token-message');
    const newTokenDisplay = document.getElementById('new-token-display');
    const generatedTokenValue = document.getElementById('generated-token-value');
    const tokensTableBody = document.getElementById('tokens-table').querySelector('tbody');
    const tokensMessage = document.getElementById('tokens-message');

    let adminToken = null; // Store the base64 encoded admin credentials

    // Helper to display messages
    function showMessage(element, message, type) {
        element.textContent = message;
        element.className = `message ${type}`;
        element.style.display = 'block';
    }

    function hideMessage(element) {
        element.style.display = 'none';
    }

    // Function to fetch tokens
    async function fetchTokens() {
        if (!adminToken) return;

        hideMessage(tokensMessage);
        tokensTableBody.innerHTML = '<tr><td colspan="5">Loading tokens...</td></tr>';

        try {
            const response = await fetch('/tokens/', {
                headers: {
                    'Authorization': `Basic ${adminToken}`
                }
            });
            if (!response.ok) {
                if (response.status === 401) {
                    showMessage(authMessage, 'Authentication failed. Please log in again.', 'error');
                    adminSection.style.display = 'none';
                    authSection.style.display = 'block';
                    adminToken = null;
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const tokens = await response.json();
            renderTokens(tokens);
        } catch (error) {
            console.error('Error fetching tokens:', error);
            showMessage(tokensMessage, 'Failed to load tokens.', 'error');
            tokensTableBody.innerHTML = '';
        }
    }

    // Function to render tokens in the table
    function renderTokens(tokens) {
        tokensTableBody.innerHTML = '';
        if (tokens.length === 0) {
            tokensTableBody.innerHTML = '<tr><td colspan="5">No tokens found.</td></tr>';
            return;
        }

        tokens.forEach(token => {
            const row = tokensTableBody.insertRow();
            row.insertCell().textContent = token.id;
            row.insertCell().textContent = token.token;
            row.insertCell().textContent = token.is_active ? 'Active' : 'Inactive';
            row.insertCell().textContent = new Date(token.created_at).toLocaleString();

            const actionsCell = row.insertCell();
            const toggleButton = document.createElement('button');
            toggleButton.className = 'action-button toggle-status';
            toggleButton.textContent = token.is_active ? 'Deactivate' : 'Activate';
            toggleButton.addEventListener('click', () => toggleTokenStatus(token.id, !token.is_active));
            actionsCell.appendChild(toggleButton);

            const deleteButton = document.createElement('button');
            deleteButton.className = 'action-button delete';
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => deleteToken(token.id));
            actionsCell.appendChild(deleteButton);
        });
    }

    // Function to toggle token status
    async function toggleTokenStatus(tokenId, newStatus) {
        if (!adminToken) return;
        hideMessage(tokensMessage);
        try {
            const response = await fetch(`/tokens/${tokenId}/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${adminToken}`
                },
                body: JSON.stringify({ token: "dummy", is_active: newStatus }) // 'token' field is required by schema but not used for update
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            showMessage(tokensMessage, `Token ${tokenId} status updated to ${newStatus ? 'Active' : 'Inactive'}.`, 'success');
            fetchTokens(); // Refresh the list
        } catch (error) {
            console.error('Error toggling token status:', error);
            showMessage(tokensMessage, 'Failed to update token status.', 'error');
        }
    }

    // Function to delete token
    async function deleteToken(tokenId) {
        if (!adminToken) return;
        if (!confirm(`Are you sure you want to delete token ID ${tokenId}?`)) {
            return;
        }
        hideMessage(tokensMessage);
        try {
            const response = await fetch(`/tokens/${tokenId}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Basic ${adminToken}`
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            showMessage(tokensMessage, `Token ${tokenId} deleted successfully.`, 'success');
            fetchTokens(); // Refresh the list
        } catch (error) {
            console.error('Error deleting token:', error);
            showMessage(tokensMessage, 'Failed to delete token.', 'error');
        }
    }

    // Login event listener
    loginButton.addEventListener('click', async () => {
        const username = adminUsernameInput.value;
        const password = adminPasswordInput.value;
        const credentials = btoa(`${username}:${password}`); // Base64 encode credentials

        hideMessage(authMessage);

        try {
            // Attempt to fetch tokens to verify credentials
            const response = await fetch('/tokens/', {
                headers: {
                    'Authorization': `Basic ${credentials}`
                }
            });

            if (response.ok) {
                adminToken = credentials;
                authSection.style.display = 'none';
                adminSection.style.display = 'block';
                showMessage(authMessage, 'Login successful!', 'success');
                fetchTokens(); // Load tokens after successful login
            } else {
                const errorData = await response.json();
                showMessage(authMessage, errorData.detail || 'Login failed.', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showMessage(authMessage, 'An error occurred during login.', 'error');
        }
    });

    // Generate token event listener
    generateTokenButton.addEventListener('click', async () => {
        if (!adminToken) {
            showMessage(generateTokenMessage, 'Please log in first.', 'error');
            return;
        }
        hideMessage(generateTokenMessage);
        newTokenDisplay.style.display = 'none';

        try {
            const response = await fetch('/token/generate/', {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${adminToken}`
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const newToken = await response.json();
            generatedTokenValue.textContent = newToken.token;
            newTokenDisplay.style.display = 'block';
            showMessage(generateTokenMessage, 'Token generated successfully!', 'success');
            fetchTokens(); // Refresh the list
        } catch (error) {
            console.error('Error generating token:', error);
            showMessage(generateTokenMessage, 'Failed to generate token.', 'error');
        }
    });

    // Copy button functionality
    document.querySelectorAll('.copy-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const targetId = event.target.dataset.target;
            const textToCopy = document.getElementById(targetId).textContent;
            navigator.clipboard.writeText(textToCopy).then(() => {
                alert('Copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy: ', err);
            });
        });
    });
});