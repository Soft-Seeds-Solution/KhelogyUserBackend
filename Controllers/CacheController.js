// backend/routes/cache.js
import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

router.post("/purgeCat", async (req, res) => {
    try {
        const response = await fetch(
            `https://api.cloudflare.com/client/v4/zones/${process.env.CF_ZONE_ID}/purge_cache`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.CF_API_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    files: ["https://edge.khelogy.com/api/category/nestedCategories"]
                })
            }
        );
        const data = await response.json();
        return res.json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
router.post("/purgeTag", async (req, res) => {
    try {
        const response = await fetch(
            `https://api.cloudflare.com/client/v4/zones/${process.env.CF_ZONE_ID}/purge_cache`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.CF_API_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    files: ["https://edge.khelogy.com/api/category/nestedCategories"]
                })
            }
        );
        const data = await response.json();
        return res.json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
router.post("/purgeGame", async (req, res) => {
    try {
        const response = await fetch(
            `https://api.cloudflare.com/client/v4/zones/${process.env.CF_ZONE_ID}/purge_cache`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.CF_API_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    purge_everything: true
                })
            }
        );
        const data = await response.json();
        return res.json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

export default router;