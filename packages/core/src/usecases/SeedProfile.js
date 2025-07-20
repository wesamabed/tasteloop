"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedProfile = void 0;
var observability_1 = require("@tasteloop/observability");
var SeedProfile = /** @class */ (function () {
    function SeedProfile(segmenter, recs, repo) {
        this.segmenter = segmenter;
        this.recs = recs;
        this.repo = repo;
    }
    /** Parse, call Qloo, persist, return list */
    SeedProfile.prototype.execute = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var segments, terms, results, chosen;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        observability_1.logger.debug({ text: input.seedsText }, 'seed-profile: incoming request');
                        return [4 /*yield*/, this.segmenter.segment(input.seedsText)];
                    case 1:
                        segments = _a.sent();
                        terms = segments
                            .flatMap(function (s) { return s.split(/[,\n;]/); }) // s: string
                            .map(function (t) { return t.trim(); })
                            .filter(Boolean);
                        observability_1.logger.trace({ terms: terms }, 'segmented terms');
                        return [4 /*yield*/, Promise.all(terms.map(function (t) { var _a; return _this.recs.searchEntities(t, (_a = input.maxPerSeed) !== null && _a !== void 0 ? _a : 1); }))];
                    case 2:
                        results = _a.sent();
                        chosen = results
                            .map(function (arr) { return arr[0]; }) // top hit per term
                            .filter(Boolean)
                            .map(function (e) {
                            var _a;
                            return ({
                                id: e.id,
                                name: e.name,
                                domain: e.type,
                                weight: (_a = e.score) !== null && _a !== void 0 ? _a : 1,
                            });
                        });
                        if (!(input.userKey && chosen.length)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.repo.save(input.userKey, chosen)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        observability_1.logger.debug({ chosenCount: chosen.length }, 'seeds chosen');
                        return [2 /*return*/, { chosen: chosen }];
                }
            });
        });
    };
    return SeedProfile;
}());
exports.SeedProfile = SeedProfile;
