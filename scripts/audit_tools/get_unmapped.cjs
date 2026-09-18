const http = require('http'); 
http.get('http://localhost:3012/', res => { 
  let data = ''; 
  res.on('data', chunk => data += chunk); 
  res.on('end', () => { 
    const matches = [...data.matchAll(/<img src="\/images\/([^"]+)"/g)]; 
    console.log(JSON.stringify(matches.map(m => decodeURIComponent(m[1])), null, 2)); 
  }); 
});
