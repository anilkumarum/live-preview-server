export const errorPage404 = (filePath, res) => {
	res.writeHead(404);
	res.end(`<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>404 error, page not found</title>
    </head>
    
    <body>
        <h1>404 error, Page not found</h1>
        <p>${filePath} file doesn't exist</p>
        <a href="/dir-panel/index.hbs">Open Directory Panel</a>
    </body>
    
    </html>`);
};
