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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const chatAggregator_1 = require("./libs/chatAggregator");
const other_1 = require("./utils/other");
const chat_1 = require("./libs/chat");
const common_1 = require("./utils/common");
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});
let chatWriter = null;
let agState = chatAggregator_1.initialStateForChatAggregator; // State, on Aggregator side
//let chatStateUser = initialStateForChatUserSide;
const X_NUMBER = 100;
(0, other_1.showOptions)();
readline.question('Choose an option: ', (option) => {
    switch (option) {
        case '1':
            console.log("Hello World!");
            Aggregation();
            break;
        case '2':
            console.log(process.env.HELLO);
            break;
        case '3':
            console.log("Option 3");
            break;
        default:
            console.log('Invalid option.');
    }
});
// Aggregation with User list update
function Aggregation() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const topic = process.env.TOPIC;
            const key = process.env.PRIVATE_KEY;
            const stamp = process.env.STAMP;
            const initResult = yield (0, chat_1.initChatRoom)(topic, key, stamp);
            if (!initResult)
                throw "Error while initiating chat";
            chatWriter = initResult.chatWriter;
            console.info("Users feed ref: ", initResult.usersRef);
            for (let i = 0; i < X_NUMBER; i++) {
                agState = yield (0, chatAggregator_1.doAggregationCycle)(agState, topic, chatWriter, stamp);
                agState = yield (0, chatAggregator_1.doUpdateUserList)(topic, agState);
                yield (0, common_1.sleep)(3 * 1000); // 3 seconds
            }
        }
        catch (error) {
            console.error("Error in Aggregator: ", error);
        }
    });
}
