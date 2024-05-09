import fs from 'fs';
import path from 'path';

export function showOptions() {
    console.log('\n\nOptions:\n');
    console.log('1) Test One');
    console.log('2) Start app as Streamer (Aggregator)');
    console.log('3) Start app as User');
    console.log('4) Exit\n');
}

// Will write errors into [TOPIC]_error.log
export function logErrorToFile(errorString: string): void {
  const topic = process.env.TOPIC || 'default';
  const filename = `${topic}_error.log`;

  const errorMessage = `${new Date().toISOString()} - Error: ${errorString}\n\n`;

  // Write error to file
  const filePath = path.join(process.env.LOG_DIR_PATH as string, filename);
  fs.appendFileSync(filePath, errorMessage);
}