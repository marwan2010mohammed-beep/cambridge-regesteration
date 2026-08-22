const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
const search = `    setTimeout(() => {
      setEnrollments((prev) => [newRecord, ...prev]);`;
const replace = `    setTimeout(() => {
      setEnrollments((prev) => [newRecord, ...prev]);
      
      // Fire notifications asynchronously
      dispatchDiscordWebhook(newRecord).catch(console.error);
      dispatchEmailConfirmation(newRecord).catch(console.error);
`;
code = code.replace(search, replace);
fs.writeFileSync('src/App.tsx', code);
