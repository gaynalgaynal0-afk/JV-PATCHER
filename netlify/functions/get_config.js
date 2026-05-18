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
            res.on('end', () => resolve(JSON.parse(d)));
        }).on('error', reject);
    });
}

exports.handler = async () => {
    const headers = { "Access-Control-Allow-Origin": "*" };
    try {
        const result = await jsonbinGet();
        const r = result.record;
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                tag: r.tag,
                payload: r.payload,
                maintenance: r.maintenance || false,
                maintenance_msg: r.maintenance_msg || ''
            })
        };
    } catch(e) {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, tag: '', payload: 500000, maintenance: false })
        };
    }
};
