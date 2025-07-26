const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = 'schoolData.json';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve HTML files

// Initialize data file if it doesn't exist
async function initializeData() {
    try {
        await fs.access(DATA_FILE);
    } catch (error) {
        // File doesn't exist, create it
        const initialData = {
            holidays: [],
            paymentDues: {},
            keyInfo: [],
            facultyPosts: {}
        };
        await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
        console.log('Created initial data file');
    }
}

// Read data from JSON file
async function readData() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading data:', error);
        return { holidays: [], paymentDues: {}, keyInfo: [], facultyPosts: {} };
    }
}

// Write data to JSON file
async function writeData(data) {
    try {
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing data:', error);
        return false;
    }
}

// API Routes

// Get all data
app.get('/api/data', async (req, res) => {
    const data = await readData();
    res.json(data);
});

// Post holiday
app.post('/api/holidays', async (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    const data = await readData();
    const newPost = {
        id: Date.now(),
        text: text,
        date: new Date().toLocaleString()
    };
    
    data.holidays.push(newPost);
    
    if (await writeData(data)) {
        res.json({ success: true, post: newPost });
    } else {
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// Post payment due
app.post('/api/payment-dues', async (req, res) => {
    const { classCode, text } = req.body;
    if (!classCode || !text) {
        return res.status(400).json({ error: 'Class code and text are required' });
    }

    const data = await readData();
    const newPost = {
        id: Date.now(),
        text: text,
        date: new Date().toLocaleString()
    };

    if (!data.paymentDues[classCode]) {
        data.paymentDues[classCode] = [];
    }
    data.paymentDues[classCode].push(newPost);
    
    if (await writeData(data)) {
        res.json({ success: true, post: newPost });
    } else {
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// Post key information
app.post('/api/key-info', async (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    const data = await readData();
    const newPost = {
        id: Date.now(),
        text: text,
        date: new Date().toLocaleString()
    };
    
    data.keyInfo.push(newPost);
    
    if (await writeData(data)) {
        res.json({ success: true, post: newPost });
    } else {
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// Post faculty message
app.post('/api/faculty-posts', async (req, res) => {
    const { classCode, type, text, facultyCode } = req.body;
    if (!classCode || !type || !text || !facultyCode) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const data = await readData();
    const newPost = {
        id: Date.now(),
        text: text,
        date: new Date().toLocaleString(),
        faculty: facultyCode
    };

    if (!data.facultyPosts[classCode]) {
        data.facultyPosts[classCode] = {
            homework: [],
            assignment: [],
            subject: []
        };
    }

    data.facultyPosts[classCode][type].push(newPost);
    
    if (await writeData(data)) {
        res.json({ success: true, post: newPost });
    } else {
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// Start server
async function startServer() {
    await initializeData();
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
        console.log('Open http://localhost:3000/index.html in your browser');
    });
}

startServer();