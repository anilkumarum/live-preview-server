import { createServer } from "node:http";

async function isPortAvailable(port: number) {
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

export async function getNextOpenPort(startFrom: number = 2200): Promise<number> {
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
