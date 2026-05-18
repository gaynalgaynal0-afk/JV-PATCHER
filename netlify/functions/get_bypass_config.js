const https = require('https');
const BIN_ID = process.env.BIN_ID;
const BIN_KEY = process.env.BIN_KEY;

function jsonbinGet() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.jsonbin.io',
            path: `/v3/b/${BIN_ID}/latest`,
            headers: { 'X-Master-Key': BIN_KEY }
        };
        https.get(options, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => {
                try { resolve(JSON.parse(d)); }
                catch(e) { resolve({ record: {} }); }
            });
        }).on('error', () => resolve({ record: {} }));
    });
}

exports.handler = async (event) => {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
    };

    if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };

    try {
        const result = await jsonbinGet();
        const record = result.record || {};

        // Check maintenance
        if (record.maintenance) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: false,
                    maintenance: true,
                    error: record.maintenance_msg || '🔧 Method is now in Maintenance Mode.'
                })
            };
        }

        // Always return success true with payload
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                payload: record.payload || 500000,
                tag: record.tag || ''
            })
        };

    } catch(e) {
        // Even on error return success true with default payload
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, payload: 500000 })
        };
    }
};
