console.log('Injecting code');
$.getScript(chrome.extension.getURL('/resource/jquery.cookie.js'), function(){
	console.log('jquery.cookie.js is loaded');
});
$.getScript(chrome.extension.getURL('/content_script/utilities.js'), function(){
	console.log('utilities.js is loaded');
});
$.getScript(chrome.extension.getURL('/content_script/injection.js'), function(){
	console.log('injection.js is loaded');
});
$.getScript(chrome.extension.getURL('/content_script/injection_listener.js'), function(){
	console.log('injection_listener.js is loaded');
});

// receive download links from web and send them to popup
window.addEventListener('dlink', function(req){
	chrome.runtime.sendMessage({result: req.detail, type: "dlink"})
})

// send error message to popup
window.addEventListener('error', function(req){
	chrome.runtime.sendMessage({result: req.detail, type: "error"})
})

// receive hlink from sandbox and send it to popup
window.addEventListener('hlink2', function(req){
	chrome.runtime.sendMessage({result: req.detail, type: "hlink2"})
})

// receive vcode information to sandbox and request verification
window.addEventListener('vcode', function(req){
	chrome.runtime.sendMessage({result: req.detail, type: "vcode"})
})

// proxy for retrieving high speed link
chrome.runtime.onMessage.addListener(function(req, sender, sendResponse){
	if('fs_id' in req && 'index' in req && 'isdir' in req){
		var event = new CustomEvent("hlink1", {detail: req});
		window.dispatchEvent(event);
	}
	if('greeting' in req){
		sendResponse({greeting: 'yes'});
	}
	if('page' in req){
		var event = new CustomEvent('run', {detail: req});
		window.dispatchEvent(event);
		sendResponse('run');
	}
	if('vcode' in req){
		var event = new CustomEvent('verify', {detail: req});
		window.dispatchEvent(event);
	}
})
