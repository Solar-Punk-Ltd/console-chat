import dotenv from 'dotenv';
dotenv.config();
import { chatAggregatorReducer, doAggregationCycle, doUpdateUserList, initialStateForChatAggregator } from './libs/chatAggregator';
import { initialStateForChatUserSide } from './libs/chatUserSide';
import { showOptions } from './utils/other';
import { initChatRoom } from './libs/chat';
import { BatchId, FeedWriter } from '@ethersphere/bee-js';
import { sleep } from './utils/common';
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

let chatWriter: FeedWriter | null = null;
let agState = initialStateForChatAggregator;                    // State, on Aggregator side
//let chatStateUser = initialStateForChatUserSide;
const X_NUMBER = 100;

showOptions();
readline.question('Choose an option: ', (option: string) => {
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