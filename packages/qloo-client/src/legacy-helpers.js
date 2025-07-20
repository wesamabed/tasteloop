"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecs = exports.searchEntities = void 0;
const cross_fetch_1 = __importDefault(require("cross-fetch"));
const BASE = process.env.QLOO_BASE ?? 'https://hackathon.api.qloo.com';
async function qlooFetch(path, params) {
    const url = new URL(path.startsWith('/') ? path : `/${path}`, BASE);
    if (params) {
        for (const [k, v] of Object.entries(params)) {
            Array.isArray(v)
                ? v.forEach(val => url.searchParams.append(k, String(val)))
                : url.searchParams.set(k, String(v));
        }
    }
    const apiKey = process.env.QLOO_API_KEY ?? '';
    const headers = {
        'Content-Type': 'application/json',
        Authorization: apiKey,
        'x-api-key': apiKey,
    };
    const res = await (0, cross_fetch_1.default)(url.toString(), { headers });
    if (!res.ok)
        throw new Error(`Qloo API ${res.status}: ${await res.text()}`);
    return res.json();
}
const searchEntities = (query) => qlooFetch('/search', { query });
exports.searchEntities = searchEntities;
const getRecs = (sampleIds, domain, limit = 5) => {
    const params = { sample: sampleIds, limit };
    if (domain)
        params.domain = domain;
    return qlooFetch('/recs', params);
};
exports.getRecs = getRecs;
