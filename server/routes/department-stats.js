const express = require('express');
const router = express.Router();
const DepartmentStatsModel = require('../models/DepartmentStatsModel');

router.get('/', async (req, res) => {
    try {
        let stats;
        if (req.query.include === 'all') {
            // Fetch all data, including old and new
            stats = await DepartmentStatsModel.find({});
        } else {
            // Fetch only new data
            stats = await DepartmentStatsModel.find({ isNew: true });
        }
        res.json(stats);
    } catch (error) {
        console.error('Error fetching department stats:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router; 