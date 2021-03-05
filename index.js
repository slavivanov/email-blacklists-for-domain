

const blacklists = ["url.0spam.org", "0spamurl.fusionzero.com", "uribl.zeustracker.abuse.ch", "uribl.abuse.ro", "blacklist.netcore.co.in", "bsb.empty.us", "bsb.spamlookup.net", "black.dnsbl.brukalai.lt", "light.dnsbl.brukalai.lt", "dul.blackhole.cantv.net", "hog.blackhole.cantv.net", "rhsbl.blackhole.cantv.net", "rot.blackhole.cantv.net", "spam.blackhole.cantv.net", "bl.fmb.la", "communicado.fmb.la", "nsbl.fmb.la", "short.fmb.la", "black.junkemailfilter.com", "uribl.mailcleaner.net", "dbl.nordspam.com", "ubl.nszones.com", "uribl.pofon.foobar.hu", "rhsbl.rbl.polspam.pl", "rhsbl-h.rbl.polspam.pl", "mailsl.dnsbl.rjek.com", "urlsl.dnsbl.rjek.com", "rhsbl.rymsho.ru", "public.sarbl.org", "rhsbl.scientificspam.net", "nomail.rhsbl.sorbs.net", "badconf.rhsbl.sorbs.net", "rhsbl.sorbs.net", "fresh.spameatingmonkey.net", "fresh10.spameatingmonkey.net", "fresh15.spameatingmonkey.net", "fresh30.spameatingmonkey.net", "freshzero.spameatingmonkey.net", "uribl.spameatingmonkey.net", "urired.spameatingmonkey.net", "dbl.spamhaus.org", "dnsbl.spfbl.net", "dbl.suomispam.net", "multi.surbl.org", "uribl.swinog.ch", "dob.sibl.support-intelligence.net", "dbl.tiopan.com", "black.uribl.com", "grey.uribl.com", "multi.uribl.com", "red.uribl.com", "uri.blacklist.woody.ch", "rhsbl.zapbl.net", "d.bl.zenrbl.pl"];
const dns = require('dns');
const { argv } = require('process');

// Resolves to false if timeout is reached before passed `promise`
const promiseWithTimeout = (timeoutMs, promise) => {
	return Promise.race([
		promise(),
		new Promise((resolve, reject) => setTimeout(() => resolve(false), timeoutMs)),
	]);
}

const checkDomain = async (domain) => {
	// Go through all blacklists
	const promises = blacklists.map(async blacklist => {
		// Check current blacklist (wait up to 5s)
		const blacklistResponse = await promiseWithTimeout(5000,
			() => new Promise((resolve) =>
				// Check if the current domain is on this blacklist
				dns.resolve(`${domain}.${blacklist}`, 'A', (err, res) => {
					// https://www.ietf.org/rfc/rfc5782.txt
					// Error means the domain is not on the blacklist
					if (err) return resolve(false);
					if (res) {
						// 127.0.0.1 does NOT mean listed
						if (res && res[0] === "127.0.0.1") {
							resolve(false)
						};
						// non empty res means the domain is blacklisted
						return resolve(res);
					}
					// no response means not on the blacklist
					return resolve(false);
				})));
		const response = { list: blacklist, blacklisted: Boolean(blacklistResponse), response: blacklistResponse };
		return response;
	});
	// Wait for all blacklists
	const result = await Promise.all(promises);
	// count how many times the domain has been blacklisted
	const count = result.reduce((acc, item) => {
		if (item.blacklisted) return acc + 1;
		return acc;
	}, 0);
	const output = { domain, count, result };
	console.log(output);
	return (output);
};

const domain = argv[2];

if (!domain) throw new Error("Usage node index.js domain.com");



checkDomain(domain);







