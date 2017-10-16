function saveOptions(e) {
	e.preventDefault();
	browser.storage.local.set({
		useSync: document.querySelector("#useSyncId").checked
	});
}

function restoreOptions() {
	function setCurrentChoice(result) {
		document.querySelector("#useSyncId").checked = result.useSync;
	}

	function onError(error) {
		console.log('Error: ${error}');
	}

	browser.storage.local.get("useSync").then(setCurrentChoice, onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);