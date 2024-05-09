import dotenv from 'dotenv';
dotenv.config();
import { chatAggregatorReducer, doAggregationCycle, doUpdateUserList, initialStateForChatAggregator } from './libs/chatAggregator';
import { ChatActions, chatUserSideReducer, initialStateForChatUserSide } from './libs/chatUserSide';
import { showOptions } from './utils/other';
import { EthAddress, MessageData, initChatRoom, registerUser, writeToOwnFeed } from './libs/chat';
import { BatchId, FeedWriter } from '@ethersphere/bee-js';
import { sleep } from './utils/common';
import { ethers } from 'ethers';
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

let chatWriter: FeedWriter | null = null;
let agState = initialStateForChatAggregator;                    // State, on Aggregator side
let wState = initialStateForChatUserSide;                       // State, the Writer
let rState = initialStateForChatUserSide;                       // State, Reader
const X_NUMBER = 100;

showOptions();
readline.question('Choose an option: ', (option: string) => {
    switch (option) {
      case '1':
        Aggregation();
        break;  
      case '2': 
        Writer();
        break;
      case '3':
        console.log("Option 3");
        break;
      default:
        console.log('Invalid option.');
    }
});


// Aggregation with User list update
async function Aggregation() {
  try {
    const topic = process.env.TOPIC as string;
    const key = process.env.PRIVATE_KEY as string;
    const stamp = process.env.STAMP as BatchId;
  
    const initResult = await initChatRoom(topic, key, stamp);
    if (!initResult) throw "Error while initiating chat";

    chatWriter = initResult.chatWriter;
    console.info("Users feed ref: ", initResult.usersRef);

    for (let i = 0; i < X_NUMBER; i++) {
      agState = await doAggregationCycle(agState, topic, chatWriter, stamp);
      agState = await doUpdateUserList(topic, agState);
      await sleep(3 * 1000);          // 3 seconds
    }

  } catch (error) {
    console.error("Error in Aggregator: ", error);
  }
}

// User who writes
async function Writer() {
  try {
    const topic = process.env.TOPIC as string;
    const stamp = process.env.STAMP as BatchId;
    const streamerAddress = "0xeD159dF6717cFa27cfCAC26f9efC2d7980debD49" as EthAddress;
    const username = "Tester";
    const wallet = ethers.Wallet.createRandom();

    const registerResult = await registerUser(topic, username, stamp, wallet);
    if (!registerResult) throw "Error while registering user!";

    // Send messages in a loop
    for (let i = 0; i < X_NUMBER; i++) {
      const message: MessageData = {
        message: `Message ${i}`,
        timestamp: Date.now(),
        username,
        address: wallet.address as EthAddress
      }
      const ref = await writeToOwnFeed(topic, streamerAddress, wState.ownFeedIndex, message, stamp, wallet);
      // Increment own feed index
      wState = chatUserSideReducer(wState, { type: ChatActions.UPDATE_OWN_FEED_INDEX, payload: { ownFeedIndex: wState.ownFeedIndex + 1 } });
      await sleep(2 * 1000);        // 2 seconds
    }

    // Periodically write a new message, like "MESSAGE 1"
  } catch (error) {
    console.error("Error in Writer: ", error);
  }
}

// User who reads
async function Reader() {
  try {
    // Read the feed
  } catch (error) {
    console.error("Error in Reader: ", error);
  }
}