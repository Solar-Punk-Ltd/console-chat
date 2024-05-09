import dotenv from 'dotenv';
dotenv.config();
import { chatAggregatorReducer, doAggregationCycle, doUpdateUserList, initialStateForChatAggregator } from './libs/chatAggregator';
import { ChatActions, chatUserSideReducer, initialStateForChatUserSide, readNextMessage } from './libs/chatUserSide';
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
        Reader();
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
      await sleep(1 * 1000);          // 1 second(s)
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
    const streamerAddress = process.env.STREAMER_ADDRESS as EthAddress;
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
      await sleep(6 * 1000);        // 6 seconds
    }

  } catch (error) {
    console.error("Error in Writer: ", error);
  }
}

// User who reads
async function Reader() {
  try {
    const topic = process.env.TOPIC as string;
    const stamp = process.env.STAMP as BatchId;
    const streamerAddress = process.env.STREAMER_ADDRESS as EthAddress;
    const username = "Reader";
    const wallet = ethers.Wallet.createRandom();

    const registerResult = await registerUser(topic, username, stamp, wallet);
    if (!registerResult) throw "Error while registering user!";

    // Read messages in a loop
    for (let i = 0; i < X_NUMBER; i++) {
      rState = await readNextMessage(rState, topic, streamerAddress);
      console.info(rState.messages);
      await sleep(1 * 3000);        // 1 second(s)
    }

  } catch (error) {
    console.error("Error in Reader: ", error);
  }
}