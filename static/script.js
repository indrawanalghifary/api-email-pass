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
    const tokensTableBody = document.getElementById('tokens-table-body');
    const tokensMessage = document.getElementById('tokens-message');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const logoutButton = document.getElementById('logout-button');

    let adminToken = null; // Store the base64 encoded admin credentials

    // Function to automatically login if credentials exist in localStorage
    async function autoLogin() {
        const savedCredentials = localStorage.getItem('adminCredentials');
        if (savedCredentials) {
            // Check if credentials are still valid by attempting to fetch tokens
            try {
                const response = await fetch('/tokens/', {
                    headers: {
                        'Authorization': `Basic ${savedCredentials}`
                    }
                });

                if (response.ok) {
                    // Credentials are valid, set the adminToken and show admin section
                    adminToken = savedCredentials;
                    authSection.classList.add('hidden');
                    adminSection.classList.remove('hidden');
                    adminSection.classList.add('slide-in');
                    fetchTokens(); // Load tokens after automatic login
                    return true;
                } else {
                    // Credentials are invalid, remove them from localStorage
                    localStorage.removeItem('adminCredentials');
                    return false;
                }
            } catch (error) {
                console.error('Error during auto-login check:', error);
                return false;
            }
        }
        return false;
    }

    // Function to logout and clear credentials from localStorage
    function logout() {
        localStorage.removeItem('adminCredentials');
        adminToken = null;
        authSection.classList.remove('hidden');
        adminSection.classList.add('hidden');
        showMessage(authMessage, 'Logged out successfully.', 'success');
    }

    // Theme toggle functionality
    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
    }

    function setTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.body.classList.add('dark');
            themeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            document.body.classList.remove('dark');
            themeIcon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
        }
        localStorage.setItem('theme', theme);
    }

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    });

    // Initialize theme on page load
    initTheme();

    // Check for saved credentials and attempt auto-login
    autoLogin();

    // Logout button event listener
    logoutButton.addEventListener('click', () => {
        logout();
    });

    // Helper to display messages
    function showMessage(element, message, type) {
        element.textContent = message;
        element.className = `message-container ${type}`;
        element.style.display = 'block';
    }

    function hideMessage(element) {
        element.style.display = 'none';
    }

    // Function to fetch tokens
    async function fetchTokens() {
        if (!adminToken) return;

        hideMessage(tokensMessage);
        const loadingRow = document.createElement('tr');
        loadingRow.innerHTML = `<td colspan="5" class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">Loading tokens...</td>`;
        tokensTableBody.innerHTML = '';
        tokensTableBody.appendChild(loadingRow);

        try {
            const response = await fetch('/tokens/', {
                headers: {
                    'Authorization': `Basic ${adminToken}`
                }
            });
            if (!response.ok) {
                if (response.status === 401) {
                    showMessage(authMessage, 'Authentication failed. Please log in again.', 'error');
                    adminSection.classList.add('hidden');
                    authSection.classList.remove('hidden');
                    adminToken = null;
                    // Remove invalid credentials from localStorage
                    localStorage.removeItem('adminCredentials');
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
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `<td colspan="5" class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">No tokens found.</td>`;
            tokensTableBody.appendChild(emptyRow);
            return;
        }

        tokens.forEach(token => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 fade-in';
            
            const idCell = document.createElement('td');
            idCell.className = 'px-6 py-4 whitespace-nowrap text-sm font-medium';
            idCell.setAttribute('data-label', 'ID');
            idCell.textContent = token.id;
            
            const tokenCell = document.createElement('td');
            tokenCell.className = 'px-6 py-4 text-sm max-w-xs truncate';
            tokenCell.setAttribute('data-label', 'Token');
            tokenCell.textContent = token.token;
            
            const statusCell = document.createElement('td');
            statusCell.className = 'px-6 py-4 whitespace-nowrap text-sm';
            statusCell.setAttribute('data-label', 'Status');
            if (token.is_active) {
                statusCell.innerHTML = '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">Active</span>';
            } else {
                statusCell.innerHTML = '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">Inactive</span>';
            }
            
            const dateCell = document.createElement('td');
            dateCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400';
            dateCell.setAttribute('data-label', 'Created At');
            dateCell.textContent = new Date(token.created_at).toLocaleString();
            
            const actionsCell = document.createElement('td');
            actionsCell.className = 'px-6 py-6 whitespace-nowrap text-sm font-medium';
            actionsCell.setAttribute('data-label', 'Actions');
            
            const actionContainer = document.createElement('div');
            actionContainer.className = 'action-button-container flex flex-wrap gap-2';
            
            const toggleButton = document.createElement('button');
            toggleButton.className = `toggle-status inline-flex items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm transition-colors ${
                token.is_active 
                    ? 'bg-yellow-500 hover:bg-yellow-600' 
                    : 'bg-blue-500 hover:bg-blue-600'
            }`;
            toggleButton.textContent = token.is_active ? 'Deactivate' : 'Activate';
            toggleButton.addEventListener('click', () => toggleTokenStatus(token.id, !token.is_active));
            
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete inline-flex items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-500 hover:bg-red-600 transition-colors';
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => deleteToken(token.id));
            
            actionContainer.appendChild(toggleButton);
            actionContainer.appendChild(deleteButton);
            actionsCell.appendChild(actionContainer);
            
            row.appendChild(idCell);
            row.appendChild(tokenCell);
            row.appendChild(statusCell);
            row.appendChild(dateCell);
            row.appendChild(actionsCell);
            
            tokensTableBody.appendChild(row);
        });
    }

    // Function to toggle token status
    async function toggleTokenStatus(tokenId, newStatus) {
        if (!adminToken) return;
        hideMessage(tokensMessage);
        
        // Show loading state on button
        const button = event.target;
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = newStatus ? 'Deactivating...' : 'Activating...';
        
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
        } finally {
            // Restore button state
            button.disabled = false;
            button.textContent = originalText;
        }
    }

    // Function to delete token
    async function deleteToken(tokenId) {
        if (!adminToken) return;
        const confirmation = confirm(`Are you sure you want to delete token ID ${tokenId}?`);
        if (!confirmation) return;
        
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

        // Show loading state on login button
        loginButton.disabled = true;
        loginButton.textContent = 'Logging in...';
        
        try {
            // Attempt to fetch tokens to verify credentials
            const response = await fetch('/tokens/', {
                headers: {
                    'Authorization': `Basic ${credentials}`
                }
            });

            if (response.ok) {
                adminToken = credentials;
                // Save credentials to localStorage for auto-login
                localStorage.setItem('adminCredentials', credentials);
                authSection.classList.add('hidden');
                adminSection.classList.remove('hidden');
                adminSection.classList.add('slide-in');
                showMessage(authMessage, 'Login successful!', 'success');
                fetchTokens(); // Load tokens after successful login
            } else {
                const errorData = await response.json();
                showMessage(authMessage, errorData.detail || 'Login failed.', 'error');
                // Remove invalid credentials from localStorage if login fails
                localStorage.removeItem('adminCredentials');
            }
        } catch (error) {
            console.error('Login error:', error);
            showMessage(authMessage, 'An error occurred during login.', 'error');
            // Remove invalid credentials from localStorage if login fails
            localStorage.removeItem('adminCredentials');
        } finally {
            // Restore button state
            loginButton.disabled = false;
            loginButton.textContent = 'Login';
        }
    });

    // Generate token event listener
    generateTokenButton.addEventListener('click', async () => {
        if (!adminToken) {
            showMessage(generateTokenMessage, 'Please log in first.', 'error');
            return;
        }
        hideMessage(generateTokenMessage);
        newTokenDisplay.classList.add('hidden');

        // Show loading state on generate button
        generateTokenButton.disabled = true;
        generateTokenButton.textContent = 'Generating...';
        
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
            newTokenDisplay.classList.remove('hidden');
            newTokenDisplay.classList.add('slide-in');
            showMessage(generateTokenMessage, 'Token generated successfully!', 'success');
            fetchTokens(); // Refresh the list
        } catch (error) {
            console.error('Error generating token:', error);
            showMessage(generateTokenMessage, 'Failed to generate token.', 'error');
        } finally {
            // Restore button state
            generateTokenButton.disabled = false;
            generateTokenButton.textContent = 'Generate Token';
        }
    });

    // Copy button functionality
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('copy-button')) {
            const targetId = event.target.dataset.target;
            const textToCopy = document.getElementById(targetId).textContent;
            navigator.clipboard.writeText(textToCopy).then(() => {
                // Create a temporary tooltip
                const originalText = event.target.textContent;
                event.target.textContent = 'Copied!';
                
                setTimeout(() => {
                    event.target.textContent = originalText;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
            });
        }
    });
    
    // Add animation for showing/hiding sections
    const sections = [authSection, adminSection];
    sections.forEach(section => {
        section.addEventListener('transitionstart', () => {
            section.style.overflow = 'hidden';
        });
        
        section.addEventListener('transitionend', () => {
            if (section.classList.contains('hidden')) {
                section.style.overflow = '';
            }
        });
    });
});