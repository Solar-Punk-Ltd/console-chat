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
Object.defineProperty(exports, "__esModule", { value: true });
exports.readNextMessage = exports.chatUserSideReducer = exports.initialStateForChatUserSide = exports.ChatActions = void 0;
const chat_1 = require("../utils/chat");
const chat_2 = require("./chat");
var ChatActions;
(function (ChatActions) {
    ChatActions["UPDATE_OWN_FEED_INDEX"] = "UPDATE_OWN_FEED_INDEX";
    ChatActions["UPDATE_CHAT_INDEX"] = "UPDATE_CHAT_INDEX";
    ChatActions["ADD_MESSAGE"] = "ADD_MESSAGE";
    ChatActions["ARRANGE"] = "ARRANGE";
})(ChatActions || (exports.ChatActions = ChatActions = {}));
exports.initialStateForChatUserSide = {
    messages: [],
    ownFeedIndex: 0,
    chatIndex: 0
};
function chatUserSideReducer(state, action) {
    switch (action.type) {
        case ChatActions.ADD_MESSAGE:
            return Object.assign(Object.assign({}, state), { messages: [
                    ...state.messages,
                    action.payload.message
                ] });
        case ChatActions.UPDATE_OWN_FEED_INDEX:
            return Object.assign(Object.assign({}, state), { ownFeedIndex: action.payload.ownFeedIndex });
        case ChatActions.UPDATE_CHAT_INDEX:
            return Object.assign(Object.assign({}, state), { chatIndex: action.payload.chatIndex });
        case ChatActions.ARRANGE:
            let orderedMessages = (0, chat_1.removeDuplicate)(state.messages);
            orderedMessages = (0, chat_1.orderMessages)(orderedMessages);
            return Object.assign(Object.assign({}, state), { messages: orderedMessages });
        default:
            return state;
    }
}
exports.chatUserSideReducer = chatUserSideReducer;
function readNextMessage(state, streamTopic, streamerAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield (0, chat_2.readSingleMessage)(state.chatIndex, streamTopic, streamerAddress);
            if (!result)
                throw 'Error reading message!';
            state = chatUserSideReducer(state, { type: ChatActions.ADD_MESSAGE, payload: { message: result } }); // Add messagse
            state = chatUserSideReducer(state, { type: ChatActions.ARRANGE }); // Arrange messages
            state = chatUserSideReducer(state, { type: ChatActions.UPDATE_CHAT_INDEX, payload: { chatIndex: state.chatIndex + 1 } }); // Increment chat index
            return state;
        }
        catch (error) {
            // Currently we can't distinguish "no new messages" from error
            console.info("No new messages this time.");
            return state;
        }
    });
}
exports.readNextMessage = readNextMessage;
