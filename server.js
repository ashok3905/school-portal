const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Use local file for development
const DATA_FILE = 'schoolData.json';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.'))); // Serve HTML files

// Initialize data file if it doesn't exist
async function initializeData() {
    try {
        await fs.access(DATA_FILE);
        console.log('Data file exists');
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

// Post holiday (Admin only)
app.post('/api/holidays', async (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    const data = await readData();
    const newPost = {
        id: Date.now(),
        text: text,
        date: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    };
    
    data.holidays.push(newPost);
    
    if (await writeData(data)) {
        console.log('Holiday posted:', newPost);
        res.json({ success: true, post: newPost });
    } else {
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// Post payment due (Admin only)
app.post('/api/payment-dues', async (req, res) => {
    const { classCode, text } = req.body;
    if (!classCode || !text) {
        return res.status(400).json({ error: 'Class code and text are required' });
    }

    const data = await readData();
    const newPost = {
        id: Date.now(),
        text: text,
        date: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    };

    if (!data.paymentDues[classCode]) {
        data.paymentDues[classCode] = [];
    }
    data.paymentDues[classCode].push(newPost);
    
    if (await writeData(data)) {
        console.log('Payment due posted for class', classCode, ':', newPost);
        res.json({ success: true, post: newPost });
    } else {
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// Post key information (Admin only)
app.post('/api/key-info', async (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    const data = await readData();
    const newPost = {
        id: Date.now(),
        text: text,
        date: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    };
    
    data.keyInfo.push(newPost);
    
    if (await writeData(data)) {
        console.log('Key info posted:', newPost);
        res.json({ success: true, post: newPost });
    } else {
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// Post faculty message (Faculty only)
app.post('/api/faculty-posts', async (req, res) => {
    const { classCode, type, text, facultyCode } = req.body;
    if (!classCode || !type || !text || !facultyCode) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate type
    if (!['homework', 'assignment', 'subject'].includes(type)) {
        return res.status(400).json({ error: 'Invalid post type' });
    }

    const data = await readData();
    const newPost = {
        id: Date.now(),
        text: text,
        date: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        faculty: facultyCode
    };

    // Initialize class structure if it doesn't exist
    if (!data.facultyPosts[classCode]) {
        data.facultyPosts[classCode] = {
            homework: [],
            assignment: [],
            subject: []
        };
    }

    // Ensure the type array exists
    if (!data.facultyPosts[classCode][type]) {
        data.facultyPosts[classCode][type] = [];
    }

    data.facultyPosts[classCode][type].push(newPost);
    
    if (await writeData(data)) {
        console.log(`Faculty post (${type}) for class ${classCode}:`, newPost);
        res.json({ success: true, post: newPost });
    } else {
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// Delete post endpoint (for future use)
app.delete('/api/posts/:type/:id', async (req, res) => {
    const { type, id } = req.params;
    const data = await readData();
    
    try {
        if (type === 'holiday') {
            data.holidays = data.holidays.filter(post => post.id != id);
        } else if (type === 'keyinfo') {
            data.keyInfo = data.keyInfo.filter(post => post.id != id);
        }
        // Add more delete logic as needed
        
        if (await writeData(data)) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: 'Failed to delete post' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error deleting post' });
    }
});

// Serve HTML files explicitly
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/schoollogin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'schoollogin.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/faculty.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'faculty.html'));
});

app.get('/student.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'student.html'));
});

app.get('/guestlogin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'guestlogin.html'));
});

// Initialize data and start server
async function startServer() {
    await initializeData();
    console.log('Data initialized');
    
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
        console.log('Admin code: 222p1a0521');
        console.log('Faculty code format: 222p-1a, 222p-2b, etc.');
        console.log('Student code format: 222p-1a-10, 222p-2b-15, etc.');
    });
}

startServer().catch(console.error);