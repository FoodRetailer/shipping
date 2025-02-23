require('dotenv').config();
const express = require('express');
const axios = require('axios');

// Initialize the express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());
app.post('/api/shopify/shipping', async (req, res) => {
    try {
        const { destination, items } = req.body.rate;
        const postcode = destination.postal_code;

        // Calculate the total weight of all items
        let totalWeight = 0;
        items.forEach(item => {
            let itemWeight = item.grams / 1000; // Convert grams to kg
            if (itemWeight === 0) {
                itemWeight = 0.1; // Set a minimum weight of 0.1kg
            }
            totalWeight += itemWeight;
        });

        console.log(`Calculating shipping rates for postcode: ${postcode}, weight: ${totalWeight}kg`);

        // Call your external shipping API to get the rates
        const shippingRates = await axios.get(`${process.env.GOOGLE_SHEET_API}?postcode=${postcode}&weight=${totalWeight}`);

        if (!shippingRates || shippingRates.data.error) {
            return res.status(404).json({ error: 'No rates found' });
        }

        res.json({
            rates: [
                {
                    service_name: "Standard Shipping",
                    total_price: (shippingRates.data[0].shipping_cost * 100).toString(),
                    currency: "AUD",
                }
            ]
        });
    } catch (error) {
        console.error('Error in API:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.post('/api/shopify/shipping', async (req, res) => {
    console.log("🚀 Received request from Shopify:");
    console.log(JSON.stringify(req.body, null, 2)); // Logs the exact request

// POST route for shipping rates
app.post('/api/shopify/shipping', async (req, res) => {
    try {
        // Log the request to see the incoming payload
        console.log('Received request:', req.body);

        // Destructure the rate and items from the incoming payload
        const { destination, items } = req.body.rate;
        const postcode = destination.postal_code;

        // Calculate the total weight of the items
        let totalWeight = 0;
        items.forEach(item => {
            totalWeight += item.grams / 1000; // Convert grams to kg
        });

        console.log(`Checking shipping rates for postcode: ${postcode}, weight: ${totalWeight}kg`);

        // Make a request to the external Google API (e.g., a Google Sheets API) to get shipping rates
        const googleApiUrl = `${process.env.GOOGLE_SHEET_API}?postcode=${postcode}&weight=${totalWeight}`;
        console.log(`Fetching from Google API: ${googleApiUrl}`);

        // Fetch shipping rate data from Google Sheets or your API
        const response = await axios.get(googleApiUrl);

        // If no data or an error is returned, handle it
        if (!response.data || response.data.error) {
            console.log('Google API Response Error:', response.data);
            return res.status(404).json({ error: 'No rates found' });
        }

        // Assuming the response contains shipping costs, we process and send them back
        const priceInCents = Math.round(parseFloat(response.data[0].shipping_cost) * 100);
        console.log(`Final shipping cost: ${priceInCents} cents`);

        // Respond with the shipping rates in a JSON format
        res.json({
            rates: [
                {
                    service_name: 'Standard Shipping',
                    total_price: priceInCents.toString(),
                    currency: 'AUD',
                },
            ],
        });
    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start the server on the specified port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

// Export the app for potential testing
module.exports = app;
