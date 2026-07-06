"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllowedOrigin = getAllowedOrigin;
const brandAssetFilenames_1 = require("../app/src/lib/brandAssetFilenames");
const ALLOWED_ORIGINS = new Set([brandAssetFilenames_1.PRODUCTION_SITE_ORIGIN, 'https://www.solaris-cet.com', 'https://solaris-cet.github.io']);
function getAllowedOrigin(origin) {
    if (origin && ALLOWED_ORIGINS.has(origin))
        return origin;
    if (origin && origin.startsWith('http://localhost'))
        return origin;
    return brandAssetFilenames_1.PRODUCTION_SITE_ORIGIN;
}
