const express = require("express");
const cors = require("cors");
const AfricasTalking = require('africastalking');
const moment = require('moment');
const axios = require('axios');
const schedule = require('node-schedule');
require('dotenv').config();

// Initialize Africa's Talking
const africastalking = AfricasTalking({
    apiKey: process.env.API_KEY,
    username: 'africasmsApp',
});

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended:true}));

// Parse the date and time from the incoming SMS message
// Function to send the user's message to the AI and receive a response
async function sendToAI(userMessage) {
    try {
        console.log("sending to AI", userMessage);
        const response = await axios.post('https://ngono-full.eastus.models.ai.azure.com/chat/completions', {
            messages: [
                {
                    role: "system",
                    content: "You are a sex education app."
                },
                {
                    role: "system",
                    content: "Hey be direct, kind and give short answers."
                },
                {
                    role: "user",
                    content: userMessage 
                }
            ],
            temperature: 0.2,
            max_tokens: 512
        }, {
            headers: {
                'Authorization': `iByv3zzUrRgo046yaGjPYvw99uRwBPDv`,
                'Content-Type': 'application/json',
            }
        });

        // console.log("Below is the response",response.data.choices[0].message.content);
        return response.data.choices[0].message.content; 
    } catch (error) {
        console.error("Error communicating with AI", error);
        return "Sorry, something went wrong with the AI response.";
    }
}

// Handle incoming SMS messages
app.post('/twowaycallback', async (req, res) => {
    const { text, from } = req.body;
    console.log(req.body)

    if (!text || !from) {
        return res.status(400).json({ error: "Invalid request format" });
    }
        console.log("Number is",from)
    try {
        // Send the incoming SMS text to the AI for a response
        const aiResponse = await sendToAI(text);
        console.log( aiResponse)
        // Send the AI response back to the user via SMS
        const smsResponse = await africastalking.SMS.send({
            from:"AFTKNG",
            to: from,
            message: aiResponse  // The response from the AI
        });

        console.log( smsResponse);
        res.status(200).send('AI response sent successfully.');
    } catch (error) {
        console.error("Error processing SMS or sending AI response", error);
        res.status(500).send('Failed to process the request.');
    }
});

app.listen(8800, () => {
    console.log("Server running on port 8800");
});
