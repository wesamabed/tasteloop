"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QlooClient = void 0;
const cross_fetch_1 = __importDefault(require("cross-fetch"));
class QlooClient {
    apiKey;
    base;
    constructor(apiKey, base = process.env.QLOO_BASE ??
        'https://hackathon.api.qloo.com') {
        this.apiKey = apiKey;
        this.base = base;
    }
    /** Implements RecommendationsPort */
    async searchEntities(query, limit = 5) {
        const url = new URL('/search', this.base);
        url.searchParams.set('query', query);
        url.searchParams.set('limit', String(limit));
        const res = await (0, cross_fetch_1.default)(url.toString(), {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': this.apiKey,
                'x-api-key': this.apiKey // works for both styles
            }
        });
        if (!res.ok) {
            const body = await res.text();
            throw new Error(`Qloo API ${res.status}: ${body}`);
        }
        /*  Hackathon search response is an array of objects like:
            { id, name, domain, score }
        */
        const data = await res.json();
        return data.map(e => ({
            id: e.id,
            name: e.name,
            type: e.domain, // adapt to RecommendationsPort DTO
            score: e.score ?? 1
        }));
    }
}
exports.QlooClient = QlooClient;
