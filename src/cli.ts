import {ingest} from "./ingest/index.js"; import {answer} from "./generation/answer.js";
const [cmd,...args]=process.argv.slice(2);
if(cmd==="ingest"){ingest(args[0]||"./sample-repo").then(console.log).catch(e=>{console.error(e);process.exit(1)})}else if(cmd==="ask"){answer(args.join(" ")).then(x=>{console.log("\n"+x.answer);console.log("\nSources:",x.sources)}).catch(e=>{console.error(e);process.exit(1)})}else console.log('Usage: npm run ingest -- ./sample-repo | npm run ask -- "question"');
