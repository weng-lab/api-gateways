"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function appendUrl(base, path) {
    if (base.endsWith("/"))
        return `${base}${path}`;
    else
        return `${base}/${path}`;
}
exports.appendUrl = appendUrl;
//# sourceMappingURL=misc.js.map