// CSV data loader utility for admin components
export const loadUsersFromCSV = async () => {
  try {
    // Try API endpoint first
    const apiResponse = await fetch('/users/csv');
    if (apiResponse.ok) {
      return await apiResponse.json();
    }
    
    // Fallback to CSV file in public folder
    const csvResponse = await fetch('/users_data.csv');
    if (!csvResponse.ok) {
      throw new Error('Failed to fetch CSV file');
    }
    
    const csvText = await csvResponse.text();
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    
    const users = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const user = {};
      
      headers.forEach((header, index) => {
        user[header] = values[index];
      });
      
      // Convert id to number
      user.id = parseInt(user.id);
      
      users.push(user);
    }
    
    return users;
  } catch (error) {
    console.error('Failed to load users from CSV:', error);
    return [];
  }
};

// Sample static data as final fallback
export const sampleUsers = [
  {
    id: 1,
    email: "maxverstappen1@gmail.com",
    full_name: "max verstappen",
    role: "student",
    major: "Divebombing",
    grad_quarter: "Spring"
  },
  {
    id: 2,
    email: "testuser@example.com",
    full_name: "Test User",
    role: "student",
    major: "Computer Science and Engineering",
    grad_quarter: "Spring"
  },
  {
    id: 5,
    email: "testadmin@example.com",
    full_name: "Test Admin",
    role: "admin",
    major: "N/A",
    grad_quarter: "N/A"
  }
];