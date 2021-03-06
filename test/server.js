
import http from 'http';
import url from 'url';
import cors from 'cors';
import qiniu from 'qiniu';
import { accessKey, secretKey, bucket } from './qiniu.config.json';

const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
const putPolicy = new qiniu.rs.PutPolicy({ scope: bucket });

const server = http.createServer((req, res) => {
	const { method, url: reqURL } = req;
	const { pathname } = url.parse(reqURL);

	const end = (data, statusCode = 200) => cors()(req, res, () => {
		res.writeHead(statusCode, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify(data));
	});

	const routes = {
		'GET /uptoken': () => {
			const uptoken = putPolicy.uploadToken(mac);
			end({ uptoken });
		},
		'GET /uptoken/alt': () => {
			const customUptokenName = putPolicy.uploadToken(mac);
			end({ customUptokenName });
		},
	};

	const route = `${method} ${pathname}`;

	if (typeof routes[route] === 'function') {
		routes[route]();
	}
	else if (route.startsWith('OPTIONS')) {
		end(null, 204);
	}
	else {
		end(null, 404);
	}

});

export const startServer = () => new Promise((resolve, reject) => {
	server.listen((err) => {
		if (err) { reject(err); }
		else {
			const { port } = server.address();
			resolve(`http://127.0.0.1:${port}`);
		}
	});
});

export const stopServer = (done) => server.close(done);

export default server;
