import fp              from "fastify-plugin"
import helmet          from "@fastify/helmet"
import rateLimit       from "@fastify/rate-limit"
import metricsPlugin   from "fastify-metrics"
import { Collection, MongoClient } from "mongodb"
import { GoogleGenerativeAI }       from "@google/generative-ai"
import { QlooClient }               from "@tasteloop/qloo-client"
import { memoize }                  from "../lib/cache"
import { logger }                   from '@tasteloop/observability';

import type {
  TextSegmentationPort,
  RecommendationsPort,
  TasteProfileRepo
} from "@tasteloop/core"
import { SeedProfile } from "@tasteloop/core"

import { NaiveSplitterAdapter }  from "../segmentation/NaiveSplitterAdapter"
import { GeminiSegmenterAdapter } from "../segmentation/GeminiSegmenterAdapter"
import { HybridSegmenter }        from "../segmentation/HybridSegmenter"

/* ---------- Mongo adapter ---------- */
class MongoTasteRepo implements TasteProfileRepo {
  constructor(private col: Collection) {}
  async save(userKey: string, seeds: readonly any[]) {
    logger.info(`Saving taste profile for userKey ${userKey}`)
    await this.col.updateOne(
      { userKey },
      { $set: { seeds, updatedAt: new Date() } },
      { upsert: true }
    )
    logger.info(`Profile saved for userKey ${userKey}`)
  }
}

/* ---------- Fastify plugin ---------- */
export default fp(async (app, _opts) => {
  logger.info("Starting core plugin registration")
  
  /* --- Security hardening & metrics --- */
  logger.info("Registering security plugins: helmet, rateLimit")
  await app.register(helmet)
  await app.register(rateLimit, { max: 40, timeWindow: "1m" })
  logger.info("Security plugins registered successfully")

  logger.info("Registering metrics plugin at /metrics endpoint")
  await app.register(metricsPlugin, { endpoint: "/metrics" })
  logger.info("Metrics plugin registered successfully")

  /* --- External clients --- */
  const mongoUri = process.env.MONGODB_URI!
  logger.info(`Connecting to MongoDB at ${mongoUri}`)
  const mongo = new MongoClient(mongoUri)
  await mongo.connect()
  logger.info("MongoDB connection established")
  
  const repo = new MongoTasteRepo(mongo.db("tasteloop").collection("profiles"))

  const qlooBase = process.env.QLOO_BASE ?? "https://hackathon.api.qloo.com"
  logger.info(`Initializing Qloo client with base URL: ${qlooBase}`)
  let qloo: RecommendationsPort = new QlooClient(process.env.QLOO_API_KEY!, qlooBase)
  
  if (process.env.QLOO_CACHE === "true") {
    logger.info("Enabling cache for Qloo client")
    // transparent memoisation
    qloo = { searchEntities: memoize(qloo.searchEntities.bind(qloo)) }
  }

  /* --- Segmentation strategy --- */
  let segmenter: TextSegmentationPort
  switch (process.env.SEGMENTER) {
    case "gemini": {
      logger.info("Using Gemini segmentation strategy")
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
      segmenter = new GeminiSegmenterAdapter(genAI.getGenerativeModel({ model: "gemini-2.0-flash" }))
      break
    }
    case "hybrid": {
      logger.info("Using Hybrid segmentation strategy")
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
      segmenter = new HybridSegmenter(
        new GeminiSegmenterAdapter(genAI.getGenerativeModel({ model: "gemini-2.0-flash" })),
        new NaiveSplitterAdapter()
      )
      break
    }
    default:
      logger.info("Using Naive segmentation strategy")
      segmenter = new NaiveSplitterAdapter()
  }

  /* --- Use-case --- */
  logger.info("Initializing SeedProfile use-case")
  const seedUC = new SeedProfile(segmenter, qloo, repo)

  /* --- Route --- */
  logger.info("Setting up POST /seed endpoint")
  app.post("/seed", {
    schema: {
      body: {
        type: "object",
        required: ["seedsText"],
        properties: {
          seedsText: { type: "string", minLength: 1, maxLength: 500 },
          userKey:   { type: "string" }
        }
      }
    }
  }, async (req, reply) => {
    logger.info("Received request at /seed endpoint")
    const out = await seedUC.execute(req.body as any)
    logger.info("Successfully processed /seed request")
    reply.send(out)
  })

  /* --- Shutdown --- */
  app.addHook("onClose", async () => {
    logger.info("Shutting down, closing MongoDB connection")
    await mongo.close()
    logger.info("MongoDB connection closed")
  })

  logger.info("Core plugin registration completed")
})