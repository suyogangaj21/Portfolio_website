export const fetchUserRole = async (userId: string): Promise<string> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/roles/${userId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();

    // Handle the nested role structure: {"role":{"role":"SUPER_ADMIN"}}
    if (data.role && data.role.role) {
      return data.role.role; // This will return "SUPER_ADMIN"
    }

    // Fallback for different response structures
    if (data.role && typeof data.role === 'string') {
      return data.role;
    }

    return 'USER'; // Default fallback
  } catch (error) {
    console.error('Error fetching roles:', error);
    return 'USER'; // Default fallback on error
  }
};
