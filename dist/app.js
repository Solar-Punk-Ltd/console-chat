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
const chatUserSide_1 = require("./libs/chatUserSide");
const other_1 = require("./utils/other");
const chat_1 = require("./libs/chat");
const common_1 = require("./utils/common");
const ethers_1 = require("ethers");
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});
let chatWriter = null;
let agState = chatAggregator_1.initialStateForChatAggregator; // State, on Aggregator side
let wState = chatUserSide_1.initialStateForChatUserSide; // State, the Writer
let rState = chatUserSide_1.initialStateForChatUserSide; // State, Reader
const X_NUMBER = 100;
(0, other_1.showOptions)();
readline.question('Choose an option: ', (option) => {
    switch (option) {
        case '1':
            Aggregation();
            break;
        case '2':
            Writer();
            break;
        case '3':
            Reader();
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
                yield (0, common_1.sleep)(1 * 1000); // 1 second(s)
            }
        }
        catch (error) {
            console.error("Error in Aggregator: ", error);
        }
    });
}
// User who writes
function Writer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const topic = process.env.TOPIC;
            const stamp = process.env.STAMP;
            const streamerAddress = process.env.STREAMER_ADDRESS;
            const username = "Tester";
            const wallet = ethers_1.ethers.Wallet.createRandom();
            const registerResult = yield (0, chat_1.registerUser)(topic, username, stamp, wallet);
            if (!registerResult)
                throw "Error while registering user!";
            // Send messages in a loop
            for (let i = 0; i < X_NUMBER; i++) {
                const message = {
                    message: `Message ${i}`,
                    timestamp: Date.now(),
                    username,
                    address: wallet.address
                };
                const ref = yield (0, chat_1.writeToOwnFeed)(topic, streamerAddress, wState.ownFeedIndex, message, stamp, wallet);
                // Increment own feed index
                wState = (0, chatUserSide_1.chatUserSideReducer)(wState, { type: chatUserSide_1.ChatActions.UPDATE_OWN_FEED_INDEX, payload: { ownFeedIndex: wState.ownFeedIndex + 1 } });
                yield (0, common_1.sleep)(15 * 1000); // 15 seconds
            }
        }
        catch (error) {
            console.error("Error in Writer: ", error);
        }
    });
}
// User who reads
function Reader() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const topic = process.env.TOPIC;
            const stamp = process.env.STAMP;
            const streamerAddress = process.env.STREAMER_ADDRESS;
            const username = "Reader";
            const wallet = ethers_1.ethers.Wallet.createRandom();
            const registerResult = yield (0, chat_1.registerUser)(topic, username, stamp, wallet);
            if (!registerResult)
                throw "Error while registering user!";
            // Read messages in a loop
            for (let i = 0; i < X_NUMBER; i++) {
                rState = yield (0, chatUserSide_1.readNextMessage)(rState, topic, streamerAddress);
                console.info(rState.messages);
                yield (0, common_1.sleep)(1 * 3000); // 1 second(s)
            }
        }
        catch (error) {
            console.error("Error in Reader: ", error);
        }
    });
}
