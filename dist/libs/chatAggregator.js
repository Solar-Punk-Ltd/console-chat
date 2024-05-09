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
exports.doUpdateUserList = exports.doMessageWriteOut = exports.doMessageFetch = exports.doAggregationCycle = exports.chatAggregatorReducer = exports.initialStateForChatAggregator = exports.AGGREGATION_CYCLE_INTERVAL = void 0;
const chat_1 = require("./chat");
const chat_2 = require("../utils/chat");
const other_1 = require("../utils/other");
exports.AGGREGATION_CYCLE_INTERVAL = 2 * 1000;
var ChatAggregatorAction;
(function (ChatAggregatorAction) {
    ChatAggregatorAction["ADD_MESSAGES"] = "ADD_MESSAGES";
    ChatAggregatorAction["DELETE_MESSAGE"] = "DELETE_MESSAGE";
    ChatAggregatorAction["UPDATE_AGGREGATED_INDEX"] = "UPDATE_AGGREGATED_INDEX";
    ChatAggregatorAction["UPDATE_USER_FEED_INDEX"] = "UPDATE_USER_FEED_INDEX";
    ChatAggregatorAction["UPDATE_INDEX_FOR_USER"] = "UPDATE_INDEX_FOR_USER";
    ChatAggregatorAction["ADD_USER"] = "ADD_USER";
    ChatAggregatorAction["LOCK_MESSAGE_WRITE"] = "LOCK_MESSAGE_WRITE";
})(ChatAggregatorAction || (ChatAggregatorAction = {}));
exports.initialStateForChatAggregator = {
    users: [],
    chatIndex: 0,
    userFeedIndex: 0,
    messages: [],
    locked: false,
};
// Reducer that handles all the chat aggregation related actions
const chatAggregatorReducer = (state = exports.initialStateForChatAggregator, action) => {
    switch (action.type) {
        case ChatAggregatorAction.ADD_MESSAGES:
            let newMessageArray = [...state.messages, ...action.payload.messages];
            newMessageArray = (0, chat_2.removeDuplicate)(newMessageArray);
            newMessageArray = (0, chat_2.orderMessages)(newMessageArray);
            return Object.assign(Object.assign({}, state), { messages: newMessageArray });
        case ChatAggregatorAction.DELETE_MESSAGE:
            let newArray = state.messages;
            newArray.splice(action.payload.index, 1);
            return Object.assign(Object.assign({}, state), { messages: newArray });
        case ChatAggregatorAction.UPDATE_AGGREGATED_INDEX:
            return Object.assign(Object.assign({}, state), { chatIndex: action.payload.chatIndex });
        case ChatAggregatorAction.UPDATE_USER_FEED_INDEX:
            return Object.assign(Object.assign({}, state), { userFeedIndex: action.payload.userFeedIndex });
        case ChatAggregatorAction.UPDATE_INDEX_FOR_USER:
            const i = state.users.findIndex((user) => user.address === action.payload.userAddress);
            if (i === -1)
                return state;
            let newUsersArray = state.users;
            newUsersArray[i].index = action.payload.index;
            return Object.assign(Object.assign({}, state), { users: newUsersArray });
        case ChatAggregatorAction.ADD_USER:
            return Object.assign(Object.assign({}, state), { users: [
                    ...state.users,
                    action.payload.user
                ] });
        case ChatAggregatorAction.LOCK_MESSAGE_WRITE:
            return Object.assign(Object.assign({}, state), { locked: action.payload.lock });
        default:
            return state;
    }
};
exports.chatAggregatorReducer = chatAggregatorReducer;
// Combines doMessageFetch and doMessageWriteOut
function doAggregationCycle(state, streamTopic, writer, stamp) {
    return __awaiter(this, void 0, void 0, function* () {
        if (state.locked)
            return state;
        // Lock message write and fetch as well
        state = (0, exports.chatAggregatorReducer)(state, { type: ChatAggregatorAction.LOCK_MESSAGE_WRITE, payload: { lock: true } });
        state = yield doMessageFetch(state, streamTopic);
        state = yield doMessageWriteOut(state, writer, stamp);
        return state;
    });
}
exports.doAggregationCycle = doAggregationCycle;
// Periodically called from Stream.tsx
// Fetches the messages, inserts them into state, and updates the read indexes for the users whose messages were read
function doMessageFetch(state, streamTopic) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Result will be array of messages, and UserWithIndex list, which is used to update the index
            const result = yield (0, chat_1.fetchAllMessages)(state.users, streamTopic);
            if (!result)
                throw "fetchAllMessages gave back null";
            let newMessages = [];
            result.map(({ user, messages }) => {
                state = (0, exports.chatAggregatorReducer)(state, { type: ChatAggregatorAction.UPDATE_INDEX_FOR_USER, payload: { index: user.index, userAddress: user.address } });
                newMessages = [...newMessages, ...messages];
            });
            state = (0, exports.chatAggregatorReducer)(state, { type: ChatAggregatorAction.ADD_MESSAGES, payload: { messages: newMessages } });
            return state;
        }
        catch (error) {
            console.error("Error fetching messages");
            (0, other_1.logErrorToFile)(`Error fetching messages: ${error}`);
            return state;
        }
    });
}
exports.doMessageFetch = doMessageFetch;
// Write temporary messages into aggregated feed, then clear the temporary messages
// Both write-out and deleting of messages happens one-by-one, not in batch actions
function doMessageWriteOut(state, writer, stamp) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let promises = [];
            // We write all messages from the temporary buffer to the aggregated feed
            for (let i = 0; i < state.messages.length; i++) {
                const promise = (0, chat_1.writeOneMessageToAggregatedFeed)(state.messages[i], writer, (state.chatIndex + i), stamp);
                promises.push(promise);
            }
            // We wait for the promises here (write operations don't need to wait for each other, order does not matter)
            const results = yield Promise.all(promises);
            // Those messages are deleted from state, which were successfully written to aggregated chat feed
            for (let i = results.length - 1; i >= 0; i--) {
                if (results[i] === null) {
                    console.warn("Could not write message with index ", i);
                    continue;
                }
                console.log(`Dispatching DELETE_MESSAGE with index ${i}, state.messages.length: ${state.messages.length}`);
                state = (0, exports.chatAggregatorReducer)(state, { type: ChatAggregatorAction.DELETE_MESSAGE, payload: { index: i } });
            }
            state = (0, exports.chatAggregatorReducer)(state, { type: ChatAggregatorAction.UPDATE_AGGREGATED_INDEX, payload: { chatIndex: state.chatIndex + results.length } });
            // Release message write lock
            state = (0, exports.chatAggregatorReducer)(state, { type: ChatAggregatorAction.LOCK_MESSAGE_WRITE, payload: { lock: false } });
            return state;
        }
        catch (error) {
            console.error("Error writing aggregated feed.");
            (0, other_1.logErrorToFile)(`Error writing aggregated feed: ${error}`);
            // Release message write lock on error as well
            state = (0, exports.chatAggregatorReducer)(state, { type: ChatAggregatorAction.LOCK_MESSAGE_WRITE, payload: { lock: false } });
            return state;
        }
    });
}
exports.doMessageWriteOut = doMessageWriteOut;
// Will save new users to state. Periodically called from Stream.tsx
// The function will remove duplicates before saving to state
function doUpdateUserList(topic, state) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let result = yield (0, chat_1.updateUserList)(topic, state.userFeedIndex, state.users);
            if (!result)
                throw "updateUserList gave back null";
            const usersToAdd = result.users.filter((user) => {
                return !state.users.some((savedUser) => savedUser.address == user.address);
            });
            usersToAdd.map((user) => {
                state = (0, exports.chatAggregatorReducer)(state, { type: ChatAggregatorAction.ADD_USER, payload: { user } });
            });
            state = (0, exports.chatAggregatorReducer)(state, { type: ChatAggregatorAction.UPDATE_USER_FEED_INDEX, payload: { userFeedIndex: result.lastReadIndex } });
            return state;
        }
        catch (error) {
            console.error("Error updating user list:");
            (0, other_1.logErrorToFile)(`Error updating user list: ${error}`);
            return state;
        }
    });
}
exports.doUpdateUserList = doUpdateUserList;
