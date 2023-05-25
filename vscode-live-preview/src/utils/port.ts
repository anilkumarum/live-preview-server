import { createServer, ServerResponse } from "node:http";

/** @param {number} port */
async function isPortAvailable(port) {
	return new Promise((resolve, reject) => {
		let server = createServer();
		server.once("error", (err) => {
			server.close();
			if (err["code"] == "EADDRINUSE") {
				resolve(false);
			} else {
				resolve(false); // or throw error!!
				// reject(err);
			}
		});
		server.once("listening", () => {
			resolve(true);
			server.close();
		});
		server.listen(port);
	});
}

/** @param {number} startFrom,@returns {number} */
export async function getNextOpenPort(startFrom = 2200) {
	let openPort = null;
	while (startFrom < 65535 || !!openPort) {
		if (await isPortAvailable(startFrom)) {
			openPort = startFrom;
			break;
		}
		startFrom++;
	}
	return openPort;
}
