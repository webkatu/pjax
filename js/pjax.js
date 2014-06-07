(function() {

	var id = 'main'; //非同期遷移する要素のid;

	var transitionElement = document.getElementById(id);
	var display = new Display(transitionElement);
	var xhr = new XMLHttpRequest();

	//履歴を上書き;
	history.replaceState({url: location.href}, null, null);

	//対象のアンカー要素に非同期通信するよう設定;
	function setRequest() {
		var anchors = document.querySelectorAll('a[class *= "async"]');
		for(var i = 0; i < anchors.length; i++) {
			anchors[i].onclick = (function(i){
				return function(e) {
					e.preventDefault();
					var url = anchors[i].href;
					url = url.replace(/index\..+/, '');
					display.hide(function() {
						//リンク先と現在のURLが一緒じゃないなら履歴を追加する
						if(url !== location.href) {
							history.pushState({url: url}, null, url);
						}
						request(url);
					});
				}
			})(i);
		}
	}
	setRequest();

	//履歴を移動した時の処理;
	window.addEventListener('popstate', function(e) {
		if(e.state) {
			display.hide(function() {
				request(e.state.url);
			});
		}
	});

	function request(url) {
		xhr.abort();
		xhr.open('GET', url);
		xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
		xhr.responseType = 'document';
		xhr.overrideMimeType('text/html; charset=utf-8'); //文字化け対策;
		xhr.timeout = '10000';
		xhr.send(null);
	}

	xhr.addEventListener('loadend', function() {
		if(xhr.status === 200) {
			var response = xhr.response;
			var responseElement = response.getElementById(id);

			//必要な要素を書き換える;
			document.title = response.title;
			document.body.id = response.body.id;
			transitionElement.innerHTML = responseElement.innerHTML;

			//実行したいスクリプト要素を取得して実行;
			var scripts = response.querySelectorAll('script[class *= "async"]');
			for(var i = 0; i < scripts.length; i++) {
				var script = cloneScript(scripts[i]);
				transitionElement.appendChild(script);
			}

			setRequest();
			display.show();
			return;
		}
		//読み込みできなかった時の処理;
		transitionElement.innerHTML = '読み込みに失敗しました。';
		display.show();
	});

	//script要素をコピー;
	function cloneScript(element) {
		var script = document.createElement('script');
		var attrs = element.attributes;
		for(var i = 0, len = attrs.length; i < len; i++) {
			var attr = attrs[i];
			script.setAttribute(attr.name, attr.value);
		}
		script.innerHTML = element.innerHTML;
		return script;
	}

	//アニメーション;
	function Display(element) {
		this.element = element;
		this.opacity = Number(document.defaultView.getComputedStyle(element, null).opacity);
		this.hideTimer = null;
		this.showTimer = null;
		this.hide = function(func) {
			clearTimeout(this.showTimer);
			var style = this.element.style;
			var css = document.defaultView.getComputedStyle(this.element, null);
			style.opacity = css.opacity;
			var that = this;
			(function recursion() {
				if(style.opacity <= 0) {
					style.display = 'none';
					if(typeof func === 'function') {
						func();
					}
					return;
				}
				style.opacity = (Number(style.opacity) - 0.1).toFixed(1);
				that.hideTimer = setTimeout(recursion, 15);
			})();
		};
		this.show = function(func) {
			clearTimeout(this.hideTimer);
			var style = this.element.style;
			style.opacity = 0;
			style.display = 'block';
			var that = this;
			(function recursion() {
				if(style.opacity >= Number(that.opacity.toFixed(1)) || style.opacity >= 1) {
					style.opacity = that.opacity;
					if(typeof func === 'function') {
						func();
					}
					return;
				}
				style.opacity = (Number(style.opacity) + 0.1).toFixed(1);
				that.showTimer = setTimeout(recursion, 15);
			})();
		};
	}
})();
