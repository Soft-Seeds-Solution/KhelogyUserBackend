import express from "express";
import Category from "../Modules/Category.js";

const router = express.Router();
const baseUrl = "https://www.khelogy.com";

// ------------------------------
// XML ESCAPE
// ------------------------------
const escapeXml = (str = "") => {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
};

// ------------------------------
// VALID SLUG
// ------------------------------
const isValidSlug = (slug) => {
    return (
        typeof slug === "string" &&
        slug.trim().length > 2 &&
        /^[a-z0-9-\/]+$/.test(slug)
    );
};

// ------------------------------
// 1. SITEMAP INDEX
// ------------------------------
router.get("/sitemap.xml", async (req, res) => {
    try {
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

    <sitemap>
        <loc>${baseUrl}/sitemap_game_category.xml</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
    </sitemap>

    <sitemap>
        <loc>${baseUrl}/pages.xml</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
    </sitemap>

</sitemapindex>`;

        res.setHeader("Content-Type", "application/xml; charset=utf-8");
        return res.status(200).send(sitemap);

    } catch (error) {
        console.error("Sitemap Index Error:", error);
        return res.status(500).send("Error generating sitemap index");
    }
});

// ------------------------------
// 2. CATEGORY SITEMAP
// ------------------------------
router.get("/sitemap_game_category.xml", async (req, res) => {
    try {
        const categories = await Category.find({
            catIndex: { $ne: "noIndex" }
        }).select("catUrl updatedAt");

        let urls = "";

        for (const cat of categories) {
            if (!isValidSlug(cat.catUrl)) continue;

            const lastmod = cat.updatedAt
                ? new Date(cat.updatedAt).toISOString()
                : new Date().toISOString();

            const loc = `${baseUrl}/category/${cat.catUrl.trim()}`;

            urls += `
<url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
</url>`;
        }

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

        res.setHeader("Content-Type", "application/xml; charset=utf-8");
        return res.status(200).send(sitemap);

    } catch (error) {
        console.error("Category Sitemap Error:", error);
        return res.status(500).send("Error generating category sitemap");
    }
});

// ------------------------------
// 3. STATIC PAGES SITEMAP
// ------------------------------
router.get("/pages.xml", async (req, res) => {
    try {

        const staticPages = [
            { url: "/", freq: "daily", priority: "1.0" },
            { url: "/about-us", freq: "yearly", priority: "0.7" },
            { url: "/contact-us", freq: "yearly", priority: "0.7" },
            { url: "/privacy-policy", freq: "yearly", priority: "0.5" },
            { url: "/terms-conditions", freq: "yearly", priority: "0.5" },
            { url: "/disclaimer", freq: "yearly", priority: "0.5" },
            { url: "/DMCA", freq: "yearly", priority: "0.5" },
            { url: "/cookies", freq: "yearly", priority: "0.5" },
        ];

        let urls = "";

        for (const page of staticPages) {

            const loc = `${baseUrl}${page.url}`;

            urls += `
<url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.freq}</changefreq>
    <priority>${page.priority}</priority>
</url>`;
        }

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

        res.setHeader("Content-Type", "application/xml; charset=utf-8");
        return res.status(200).send(sitemap);

    } catch (error) {
        console.error("Pages Sitemap Error:", error);
        return res.status(500).send("Error generating pages sitemap");
    }
});

export default router;