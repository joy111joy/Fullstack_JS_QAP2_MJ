// Import needed packages
const http = require('http');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const NewsAPI = require('newsapi');

// Initialize NewsAPI instance with your API key
const newsapi = new NewsAPI('1e0a7da8b5ed4de99489bfdd74115739');

// Create custom EventEmitter
class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();

// Initialize the host name and port variabls
const hostname = 'localhost';
const port = 3000;

// FS function to read files asynchronously
const readFile = (filePath, callback) => {
  fs.readFile(filePath, { encoding: 'utf-8' }, (err, data) => {
    if (err) {
      console.log(`Error reading file: ${filePath}`, err);
      callback(err, null);
    } else {
      callback(null, data);
    }
  });
};

// Event Emitters
// Write the current pages accessed by the user into the console
myEmitter.on('routeAccessed', (route) => {
  console.log(`Page accessed: ${route}`);
});
// Emitter to handle errors
myEmitter.on('error', (err) => {
  console.log(`Error: ${err}`);
});
// Write and handle status codes
myEmitter.on('status', (status) => {
  console.log(`Status: ${status}`);
});

// Create server
const server = http.createServer(async (req, res) => {
  // Emit 'routeAccessed'
  myEmitter.emit('routeAccessed', req.url);

  // Emit 'error'
  myEmitter.emit('error', '404 Not Found');

  // Emit 'status'
  myEmitter.emit('status', res.statusCode);

  // File extension
  const exten = path.extname(req.url);

  // Read CSS files if file's extension reads as .css
  if (exten === '.css') {
    const cssFilePath = path.join(__dirname, 'public', req.url);
    fs.readFile(cssFilePath, (err, data) => {
      if (err) {
        res.statusCode = 404;
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/css' });
        res.end(data);
      }
    });
  } else {
    res.setHeader('Content-Type', 'text/html');
    
    // Initialize variable
    let filePath = '';

    // Switch case to determine the current pages
    switch (req.url) {
      case '/':
        filePath = path.join(__dirname, 'views', 'index.html');
        break;
      case '/about':
        filePath = path.join(__dirname, 'views', 'about.html');
        break;
      case '/contact':
        filePath = path.join(__dirname, 'views', 'contact.html');
        break;
      case '/news':
        try {
            //Fetch canadian articles
          const response = await newsapi.v2.topHeadlines({
            country: 'ca',
          });
            // Extract the headlines
          const headlines = response.articles.map(article => article.title);
          // Display the headlines
          res.end(`<h1>Today's News Headlines</h1><ul>${headlines.map(headline => `<li>${headline}</li>`).join('')}</ul>`);
        } catch (error) { // Handle errors
          console.error('Error fetching news:', error);
          res.status(500).send('Error fetching news');
        }
        return;
      case '/products':
        filePath = path.join(__dirname, 'views', 'products.html');
        break;
      default:
        res.statusCode = 404;
        filePath = path.join(__dirname, 'views', '404.html');
        break;
    }

    // Handle errors related to the FS
    readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.statusCode = 500;
        res.end('<h1>Internal Server Error</h1>');
      } else {
        res.statusCode = 200;
        res.writeHead(res.statusCode, { 'Content-Type': 'text/html' });
        res.end(data);
      }
    });
  }
});

// Start server
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
