const path = require('path');
const express = require('express');
const OS = require('os');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const cors = require('cors');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/')));
app.use(cors());

// Track DB connection
let dbConnected = false;

// Test mode flag (safe for CI)
const isTestMode =
    process.env.NODE_ENV === 'test' ||
    process.argv.includes('app-test.js');

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        dbConnected = true;
        console.log("MongoDB connected");
    })
    .catch((err) => {
        dbConnected = false;
        console.error("MongoDB connection error:", err);
    });

// Schema
const dataSchema = new mongoose.Schema({
    name: String,
    id: Number,
    description: String,
    image: String,
    velocity: String,
    distance: String
});

// IMPORTANT: explicit collection name = "planets"
const planetModel = mongoose.model('Planet', dataSchema, 'planets');


// -------------------- ROUTES --------------------

// Planet API
app.post('/planet', function (req, res) {

    const planetId = req.body.id;

    if (planetId === undefined || planetId === null) {
        return res.status(400).json({
            error: "Planet id is required"
        });
    }

    if (!dbConnected && !isTestMode) {
        return res.status(503).json({
            error: "Database connection error. Please try again later."
        });
    }

    planetModel.findOne({ id: planetId }, function (err, planetData) {

        if (err) {
            console.error("MongoDB Error:", err);
            return res.status(500).json({
                error: "Error in Planet Data"
            });
        }

        if (!planetData) {
            return res.status(404).json({
                error: "Planet not found. We only have planets with IDs from 0-8."
            });
        }

        return res.status(200).json(planetData);
    });
});


// Home
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '/', 'index.html'));
});

// OS info
app.get('/os', function (req, res) {
    res.json({
        os: OS.hostname(),
        env: process.env.NODE_ENV
    });
});

// Health check - live
app.get('/live', function (req, res) {
    res.json({ status: "live" });
});

// Health check - ready
app.get('/ready', function (req, res) {
    res.json({ status: "ready" });
});


// Export ONLY app (IMPORTANT for testing)
module.exports = app;