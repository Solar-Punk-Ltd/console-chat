# Console Chat

Benchmark application, for the group chat that should be attached to the Ethercast Stream.  
This is a command line NodeJS application, it can be started in 3 modes (roles):
 * Chat Aggregator
 * User who Writes messags
 * User who Reads messages.  
  
Both of them should be started, in separate terminals.  

.env should be edited:
 * PRIVATE_KEY: a private key for the Streamer (Aggregator)
 * STREAMER_ADDRESS: associated address (Streamer/Aggregator)
 * STAMP: a valid stamp (BatchId)
 * TOPIC: any topic name, needs to be changed at every run, otherwise will try to initiate a feed that already exists
 * LOG_DIR_PATH: a path where the logs should be saved (topic name will be used), long error messages won't appear on consoles, only in log file  

