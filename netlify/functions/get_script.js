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
    const headers = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/javascript" };

    try {
        const result = await jsonbinGet();
        const record = result.record;

        const script = `
(function () {
    if (window.__app_sys_active) return;
    window.__app_sys_active = true;

    const CONFIG = ${JSON.stringify({
        tag: record.tag,
        maintenance: record.maintenance || false,
        maintenance_msg: record.maintenance_msg || '🔧 Method is now in Maintenance Mode.\\n\\nPlease wait.\\n\\nTG: @jv_60fps'
    })};

    const sysState = { active: false, locked: false };

    function showScreen(title, message, color) {
        const existing = document.getElementById('jv-overlay');
        if (existing) existing.remove();
        const overlay = document.createElement('div');
        overlay.id = 'jv-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);z-index:999999999;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:monospace;text-align:center;padding:20px;';
        overlay.innerHTML = '<div style="color:' + color + ';font-size:26px;font-weight:bold;margin-bottom:16px;">' + title + '</div><div style="color:#fff;font-size:14px;line-height:2;white-space:pre-line;">' + message + '</div><div style="color:#888;font-size:12px;margin-top:24px;">TG: @jv_60fps</div>';
        document.body.appendChild(overlay);
    }

    // Check maintenance
    if (CONFIG.maintenance) {
        document.addEventListener('DOMContentLoaded', () => {
            showScreen('🔧 MAINTENANCE', CONFIG.maintenance_msg, '#f39c12');
        });
        if (document.readyState !== 'loading') {
            showScreen('🔧 MAINTENANCE', CONFIG.maintenance_msg, '#f39c12');
        }
        return;
    }

    const sysTag = CONFIG.tag;

    document.addEventListener('SysStateUpdate', (e) => {
        sysState.active = e.detail.active;
    });

    function modifyBody(bodyStr) {
        if (!sysState.active || sysState.locked || !sysTag) return bodyStr;
        try {
            const data = JSON.parse(bodyStr);
            if (!data || !data.single_post_req_list) return bodyStr;
            let changed = false;
            for (const req of data.single_post_req_list) {
                const fInfo = req && req.single_post_feature_info;
                if (!fInfo) continue;
                const txt = fInfo.text || '';
                if (txt.includes(sysTag)) continue;
                const sep = txt.length > 0 ? ' ' : '';
                fInfo.text = txt + sep + sysTag;
                changed = true;
            }
            return changed ? JSON.stringify(data) : bodyStr;
        } catch(e) { return bodyStr; }
    }

    const origFetch = window.fetch;
    window.fetch = function() {
        const args = Array.prototype.slice.call(arguments);
        const url = args[0]; const config = args[1];
        if (typeof url === 'string' && url.includes('project/post') && config && config.body) {
            config.body = modifyBody(config.body);
        }
        return origFetch.apply(this, args);
    };

    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method, url) {
        this.__url = url;
        return origOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function(body) {
        if (this.__url && this.__url.includes('project/post') && typeof body === 'string') {
            body = modifyBody(body);
        }
        return origSend.call(this, body);
    };
})();
`;
        return { statusCode: 200, headers, body: script };
    } catch(e) {
        const script = `console.error('JV-60FPS: Server error');`;
        return { statusCode: 200, headers, body: script };
    }
};
