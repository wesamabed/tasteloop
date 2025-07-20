"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const mongodb_1 = require("mongodb");
const qloo_client_1 = require("@tasteloop/qloo-client");
const core_1 = require("@tasteloop/core");
/* ---------- Mongo adapter – implements TasteProfileRepo ---------- */
class MongoTasteRepo {
    col;
    constructor(col) {
        this.col = col;
    }
    async save(userKey, seeds) {
        await this.col.updateOne({ userKey }, { $set: { seeds, updatedAt: new Date() } }, { upsert: true });
    }
}
/* ---------- Fastify plugin ---------- */
exports.default = (0, fastify_plugin_1.default)(async (app) => {
    /* 1. external clients */
    const mongo = new mongodb_1.MongoClient(process.env.MONGODB_URI);
    await mongo.connect();
    const repo = new MongoTasteRepo(mongo.db('tasteloop').collection('profiles'));
    const qloo = new qloo_client_1.QlooClient(process.env.QLOO_API_KEY);
    /* 2. use-case */
    const seedUC = new core_1.SeedProfile(qloo, repo);
    /* 3. route */
    app.post('/seed', async (req, reply) => {
        const body = req.body;
        const output = await seedUC.execute(body);
        reply.send(output);
    });
    /* Graceful shutdown */
    app.addHook('onClose', async () => mongo.close());
});
