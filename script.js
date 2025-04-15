async function fetchHaiiloUserDirectory() {
    try {
        // Initialize variables for pagination
        let allUsers = [];
        let currentPage = 0;
        const pageSize = 100; // Adjust based on your needs
        let totalPages = 1; // Will be updated after first request
        
        // Loop through all pages
        while (currentPage < totalPages) {
            const response = await window.haiilo.api.get('/api/v1/user_directories/active/users', {
                params: {
                    page: currentPage,
                    size: pageSize,
                    projection: 'withManagers', // Include manager relationships
                    sort: 'lastName,asc' // Sort alphabetically by last name
                }
            });
            
            // Add users from this page to our collection
            allUsers = allUsers.concat(response.data._embedded.users);
            
            // Update pagination information
            totalPages = response.data.page.totalPages;
            currentPage++;
            
            // Optional: Add delay between requests if needed
            // await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return allUsers;
        
    } catch (error) {
        console.error('Error fetching user directory:', error);
        throw new Error('Failed to fetch user directory data');
    }
}