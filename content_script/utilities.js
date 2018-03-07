// variant base64 encoding function, copy from pan.baidu.com
// I don't understand it. But we don't have to.
function b64(t) {
	var e, r, a, n, o, i, s = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	for (a = t.length,
	r = 0,
	e = ""; a > r; ) {
		if (n = 255 & t.charCodeAt(r++),
		r == a) {
			e += s.charAt(n >> 2),
			e += s.charAt((3 & n) << 4),
			e += "==";
		break
		}
		if (o = t.charCodeAt(r++),
		r == a) {
			e += s.charAt(n >> 2),
			e += s.charAt((3 & n) << 4 | (240 & o) >> 4),
			e += s.charAt((15 & o) << 2),
			e += "=";
			break
		}
		i = t.charCodeAt(r++),
		e += s.charAt(n >> 2),
		e += s.charAt((3 & n) << 4 | (240 & o) >> 4),
		e += s.charAt((15 & o) << 2 | (192 & i) >> 6),
		e += s.charAt(63 & i)
	}
	return e
};

// basic function to get hlink
function get_hlink(yunData, extra, vcode, index, type, dir, fidlist, cb){
	/*
	 * 	Parameters:
	 * 		yunData:	which yunData to use
	 * 		extra:		whether extra encryption needed
	 * 		vcode:		verification code information
	 * 		index:		what the index of this file in popup is
	 * 		type:		which type of information to use
	 * 		dir:		whether this file is a directory
	 * 		fidlist:	whose hlink you want to get
	 * */

	BAIDUID = $.cookie('BAIDUID')
	BDCLND = $.cookie('BDCLND')
	$.removeCookie('BAIDUID')
	$.removeCookie('BDCLND')
	if(type == 1){
		var url = "/api/sharedownload?sign="+yunData.sign+"&timestamp="+yunData.timestamp;
		var data = "encrypt=0&product=share&uk="+yunData.uk+"&primaryid="+yunData.shareid;
	}
	else if(type == 2){
		var url = "/api/sharedownload?sign="+yunData.SIGN+"&timestamp="+yunData.TIMESTAMP;
		var data = "encrypt=0&product=share&uk="+yunData.SHARE_UK+"&primaryid="+yunData.SHARE_ID;
	}
	else if(type == 3){
		// get sign parameter
		var u = new Function("return " + yunData.sign2)()
		var sign = b64(u(yunData.sign5, yunData.sign1));
		sign = encodeURIComponent(sign);
		var url = "/api/download?sign="+sign+"&timestamp="+yunData.timestamp+"&fidlist="+JSON.stringify(fidlist)+"&bdstoken="+yunData.MYBDSTOKEN+"&type=batch";
		var data = "encrypt=0&product=share&type=batch"
	}
	else return;

	// additional information
	if(vcode)data += "&vcode_str="+vcode.vcode_str+"&vcode_input="+vcode.vcode_input;
	if(extra)data += "&extra="+encodeURIComponent(get_extra());
	if(dir)data += "&type=batch";
	data += "&fid_list="+JSON.stringify(fidlist);

	// get hlink
	$.ajax({
		type: "POST",
		url: url,
		data: data,
		dataType: "json",
		success: function(res){

			// in case of failure
			if(res.errno != 0){
				console.log(res);
				var err_msg = "Warning: can't get high speed link";

				// -20 means verification is needed
				if(res.errno == -20){

					// get verification image
					get_vcode(function(result){

						// in case that it fails to get verification image, return an error message
						if(result.feedback != 'Success'){
							var event = new CustomEvent("error", {detail: err_msg});
							window.dispatchEvent(event);
							return;
						}

						// now we have got verification image, send it to popup
						var event = new CustomEvent("vcode", {detail: {vcode: result.vcode, index: index}});
						window.dispatchEvent(event);
						return;
					})
				}

				// other errors
				var event = new CustomEvent("error", {detail: err_msg});
				window.dispatchEvent(event);
				return;
			}
			// now we have got hlink
			if(dir)cb(res.dlink.replace("www.baidupcs.com","yqall02.baidupcs.com"), index);
			else cb(res.list[0].dlink.replace("d.pcs.baidu.com","yqall02.baidupcs.com"), index);
		}
	});
	$.cookie('BAIDUID', BAIDUID)
	$.cookie('BDCLND', BDCLND)
}

// get dlink by sign and fidlist
function get_dlink(sign, fidlist, cb){
	/*
	 *	Parameters:
	 *		sign: verification parameters
	 *		fidlist: whose dlink you want to get
	  */
	$.ajax({
		type: "POST",
		url: "/api/download?sign="+sign+"&timestamp="+yunData.timestamp+"&fidlist="+JSON.stringify(fidlist)+"&bdstoken="+yunData.MYBDSTOKEN,
		success: function(d){
			var err_msg = "Error: can't get dlinks";
			if(d.errno != 0){
				var event = new CustomEvent("error", {detail: err_msg});
				window.dispatchEvent(event);
				return;
			}			
			cb(d.dlink);
		}
	})
}

// get path parameter from url
function getURLParameter(name) {
	var x = location.hash.split('/');
	var y = x[x.length-1].split('&')
	for(var i=0; i<y.length; i++){
		var e = y[i];
		e = e.split('=');
		if(e[0]==name)return e[1];
	}
	return null;
}

// share file by fs_id
function share(fs_id, cb){
	$.ajax({
		type: "POST",
		url: "/share/set?web=1&channel=chunlei&web=1&bdstoken="+yunData.MYBDSTOKEN+"&clienttype=0",
		data: "fid_list=%5B"+fs_id+"%5D&schannel=0&channel_list=%5B%5D&period=0",
		dataType: "json",
		success: function(d){
			if(d.errno != 0){
				console.log(d);
				var err_msg = "Error: cant't share this file";
				if(d.errno == 110)err_msg = "Error: this file has been shared too frequently"
				var event = new CustomEvent("error", {detail: err_msg});
				window.dispatchEvent(event);
				return
			}
			console.log("Share success");
			cb(d);
		}
	})
}

// unshare a file by its shareid
function unshare(shareid, cb){
	$.ajax({
		type: "POST",
		url: "/share/cancel?bdstoken="+yunData.MYBDSTOKEN+"&channel=chunlei&web=1&clienttype=0",
		data: "shareid_list=%5B"+shareid+"%5D",
		dataType: "json",
		success: function(d){
			if(d.errno != 0){
				console.log(d);
				var err_msg = "Warning: can't auto unshare the file";
				var event = new CustomEvent("error", {detail: err_msg});
				window.dispatchEvent(event);
				return
			}
			console.log("Unshare success");
			cb();
		}
	})
}

// get vcode
function get_vcode(cb){
	$.ajax({
		type: "GET",
		url: "/api/getvcode?prod=pan",
		success: function(res){
			if(res.errno != 0){
				var err_msg = "Warning: can't get vcode"
				var event = new CustomEvent("error", {detail: err_msg})
				window.dispatchEvent(event);
				cb({feedback: 'Failure'})
			}
			cb({feedback: 'Success', vcode: res.vcode})
		}
	})
}

// get extra parameter for verification
function get_extra(){
	var dict = {};
	var cookies = document.cookie.split(';');
	cookies.forEach(function(d){
		var x = d.split('=');
		dict[x[0]] = x[1];
	})
	var extra = JSON.stringify({sekey:decodeURIComponent(dict[" BDCLND"])});
	return extra;
}

// list directory
function list_dir(type, page, cb){
	/*
	 * Parameters:
	 * 	type: list directory in homepage or list dirctory in shared page
	 * 	page: which page to display
	  */
	console.log('Retrieving links');

	// decide which url to use to list directory
	if(type == 1)var url = "/api/list?";
	else if(type == 2)var url = "/share/list?uk="+yunData.SHARE_UK+"&shareid="+yunData.SHARE_ID+"&";
	else return;

	// append parameters
	url += "dir="+getURLParameter('path')+"&bdstoken="+yunData.MYBDSTOKEN+"&num=100&order=time&desc=1&clienttype=0&showempty=0&web=1&page="+page;

	// start to list directory
	$.ajax({
		url: url,
		success: function(res){
			console.log("links retrieved");

			// if error is encountered
			if(res.errno != 0 ){
				console.log(res);
				var event = new CustomEvent("error", {detail: "Error: can't list folder"});
				window.dispatchEvent(event);
				return;
			}
			// good, we make it
			if(res.list.length == 0){
				var event = new CustomEvent("error", {detail: "It's empty!"});
				window.dispatchEvent(event);
				return;
			}
			cb(res.list);
		}
	})
}

