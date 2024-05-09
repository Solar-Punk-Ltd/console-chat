"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logErrorToFile = exports.showOptions = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function showOptions() {
    console.log('\n\nOptions:\n');
    console.log('1) Test One');
    console.log('2) Start app as Streamer (Aggregator)');
    console.log('3) Start app as User');
    console.log('4) Exit\n');
}
exports.showOptions = showOptions;
// Will write errors into [TOPIC]_error.log
function logErrorToFile(errorString) {
    const topic = process.env.TOPIC || 'default';
    const filename = `${topic}_error.log`;
    const errorMessage = `${new Date().toISOString()} - Error: ${errorString}\n\n`;
    // Write error to file
    const filePath = path_1.default.join(process.env.LOG_DIR_PATH, filename);
    fs_1.default.appendFileSync(filePath, errorMessage);
}
exports.logErrorToFile = logErrorToFile;
