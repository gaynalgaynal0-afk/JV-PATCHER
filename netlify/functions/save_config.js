const https = require('https');
const BIN_ID = process.env.BIN_ID;
const BIN_KEY = process.env.BIN_KEY;

function jsonbinPut(data) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(data);
        const req = https.request({
            hostname: 'api.jsonbin.io',
            path: `/v3/b/${BIN_ID}`,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': BIN_KEY,
                'Content-Length': Buffer.byteLength(body)
            }
        }, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => resolve(JSON.parse(d)));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

exports.handler = async (event) => {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
    };
    if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };

    const { password, tag, payload, maintenance, maintenance_msg } = JSON.parse(event.body || "{}");
    if (password !== "MDJOYJR32") {
        return { statusCode: 200, headers, body: JSON.stringify({ success: false, error: "Wrong password" }) };
    }

    await jsonbinPut({ tag, payload, maintenance, maintenance_msg });
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
};
