window.fbAsyncInit = function() {
  FB.init({ appId: '1288727083218595', autoLogAppEvents: true, xfbml: true, version: 'v21.0' });
};

function showStatus(msg, ok) {
  var el = document.getElementById('status');
  el.textContent = msg;
  el.className = ok ? 'ok' : 'err';
}

function launchSignup() {
  var btn = document.getElementById('loginBtn');
  if (typeof FB === 'undefined') {
    showStatus('لسه بيحمّل، استني ثانيتين واضغطي تاني.', false);
    return;
  }
  btn.disabled = true;
  FB.login(function(response) {
    btn.disabled = false;
    if (response.authResponse) {
      showStatus('تم بنجاح! الكود: ' + response.authResponse.code, true);
    } else {
      showStatus('تم إلغاء العملية أو لم تكتمل الموافقة.', false);
    }
  }, {
    config_id: '1630007755244155',
    response_type: 'code',
    override_default_response_type: true,
    extras: { setup: {}, featureType: '', sessionInfoVersion: '3' }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  var btn = document.getElementById('loginBtn');
  if (btn) btn.addEventListener('click', launchSignup);
});
