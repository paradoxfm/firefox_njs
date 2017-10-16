let useSync;

function restoreOptions() {
	function setCurrentChoice(result) {
		useSync = result.useSync;
	}

	function onError(error) {
		console.log('Error: ${error}');
	}

	browser.storage.local.get("useSync").then(setCurrentChoice, onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);

function isBlock(dict, host) {
	if (dict[host] !== undefined) {
		return dict[host];
	}
	return false;
}

function getHost(url) {
	return new URL(url).hostname;
}

function getStorage() {
	//return useSync ? browser.storage.sync : browser.storage.local;
	return browser.storage.local;
}

function pushNoJsHeader(response) {
	let host = getHost(response.url);
	let headers = response.responseHeaders;
	return new Promise((resolve) => {
		getStorage().get(host).then(item => {
			if (isBlock(item, host)) {
				headers.push({name: "Content-Security-Policy", value: "script-src 'none';"});
			}
			resolve({responseHeaders: headers});
		});
	});
}

browser.webRequest.onHeadersReceived.addListener(pushNoJsHeader,
	{
		urls: ["<all_urls>"],
		types: ["main_frame", "sub_frame"]
	},
	["blocking", "responseHeaders"]
);

browser.tabs.onUpdated.addListener((id, changeInfo) => {
	if (changeInfo.url) {
		let host = getHost(changeInfo.url);
		getStorage().get(host).then(item => {
			let blocked = isBlock(item, host);
			browser.pageAction.setIcon({tabId: id, path: blocked ? "js_off.svg" : "js_on.svg"});
			browser.pageAction.setTitle({tabId: id, title: 'Javascript ' + (blocked ? 'Disabled' : 'Enabled')});
		});
	}
	browser.pageAction.show(id);
});

browser.pageAction.onClicked.addListener(function (tab) {
	let host = getHost(tab.url);
	getStorage().get(host).then(item => {
		if (!isBlock(item, host)) {
			let to_store = {};
			to_store[host] = true;
			getStorage().set(to_store).then(function () {
				browser.tabs.reload();
			});
		} else {
			getStorage().remove(host).then(function () {
				browser.tabs.reload();
			});
		}
	});
});