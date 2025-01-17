import React, { useEffect, useState } from 'react';

function DepartmentStats() {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetch all data from the API, including old and new
        fetch('/api/department-stats?include=all')
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then((data) => {
                console.log('Fetched stats:', data);
                setStats(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Error fetching department stats:', err);
                setError(err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <p>Loading department statistics...</p>;
    }

    if (error) {
        return <p>Error loading data: {error.message}</p>;
    }

    return (
        <div>
            <h1>Department Statistics</h1>
            {stats.length > 0 ? (
                <ul>
                    {stats.map((item, index) => (
                        <li key={index}>
                            <strong>{item.departmentName}</strong>: {item.statistic}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No data available.</p>
            )}
        </div>
    );
}

export default DepartmentStats; 