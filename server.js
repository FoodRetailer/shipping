require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// ✅ Correct API Route for Vercel
app.post('/api/shopify/shipping', async (req, res) => {
    try {
        console.log("Received request:", req.body);

        const { destination, items } = req.body.rate;
        const postcode = destination.postal_code;
        let totalWeight = 0;

        items.forEach(item => {
            totalWeight += item.grams / 1000; // Convert grams to kg
        });

        console.log(`Checking shipping rates for postcode: ${postcode}, weight: ${totalWeight}kg`);

        const googleApiUrl = `${process.env.GOOGLE_SHEET_API}?postcode=${postcode}&weight=${totalWeight}`;
        console.log(`Fetching from Google API: ${googleApiUrl}`);

        const response = await axios.get(googleApiUrl);

        if (!response.data || response.data.error) {
            console.log("Google API Response Error:", response.data);
            return res.status(404).json({ error: "No rates found" });
        }

        const priceInCents = Math.round(parseFloat(response.data[0].shipping_cost) * 100);
        console.log(`Final shipping cost: ${priceInCents} cents`);

        res.json({
            rates: [
                {
                    service_name: "Standard Shipping",
                    total_price: priceInCents.toString(),
                    currency: "AUD"
                }
            ]
        });

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Fixing Export for Vercel
module.exports = app;

