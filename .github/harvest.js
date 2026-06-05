const fs = require('fs');
const repo = process.env.REPO_NAME || 'unknown';
let c = '';
['README.md','package.json','SYSTEM.md','context.md'].forEach(f => {
  try { c += fs.readFileSync(f,'utf8').slice(0,1000) + '\n'; } catch(e) {}
});
if (!c.trim()) { console.log('skip - no content'); process.exit(0); }
fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    messages: [{role:'user',content:'Output ONLY valid JSON no markdown no explanation: {"knowledge_atoms":[{"id":"'+repo+'-auto-1","category":"BUILD_METHOD","title":"short title","core":"what this repo does","confidence":0.85,"impact":6,"status":"implemented","tags":["'+repo+'"]}]} Repo context:\n'+c.slice(0,800)}]
  })
})
.then(r => r.json())
.then(d => {
  const t = d.content[0].text.replace(/```json|```/g,'').trim();
  return fetch('https://fanz-github-mcp-production.up.railway.app/v1/brain/ingest', {
    method: 'POST',
    headers: {'Content-Type':'application/json','x-api-key':process.env.MCP_API_KEY},
    body: t
  });
})
.then(r => r.json())
.then(d => console.log('Harvested:', repo, 'added:', d.added))
.catch(e => console.log('Error:', e.message));
