"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchEntities = searchEntities;
exports.getRecs = getRecs;
const cross_fetch_1 = __importDefault(require("cross-fetch"));
const BASE = process.env.QLOO_BASE ?? 'https://api.qloo.com'; // update when docs available
async function qlooFetch(path) {
    const res = await (0, cross_fetch_1.default)(`${BASE}${path}`, {
        headers: {
            'Authorization': `Bearer ${process.env.QLOO_API_KEY}`,
            'Content-Type': 'application/json'
        }
    });
    if (!res.ok) {
        throw new Error(`Qloo API error ${res.status}`);
    }
    return res.json();
}
async function searchEntities(query) {
    return qlooFetch(`/search?query=${encodeURIComponent(query)}`);
}
async function getRecs(sampleIds, domain, limit = 5) {
    const params = new URLSearchParams({ sample: sampleIds.join(','), domain, limit: String(limit) });
    return qlooFetch(`/recs?${params.toString()}`);
}
