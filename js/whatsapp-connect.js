window.fbAsyncInit = function () {
  FB.init({ appId: '1288727083218595', autoLogAppEvents: true, xfbml: true, version: 'v21.0' });
};

function showStatus(msg, ok) {
  var el = document.getElementById('status');
  el.textContent = msg;
  el.className = ok ? 'ok' : 'err';
}

var watchdogTimer = null;

function resetButton() {
  var btn = document.getElementById('loginBtn');
  if (btn) btn.disabled = false;
  if (watchdogTimer) { clearTimeout(watchdogTimer); watchdogTimer = null; }
}

function launchSignup() {
  var btn = document.getElementById('loginBtn');

  if (typeof FB === 'undefined') {
    showStatus('السكريبت لسه ما حملّش، جرّبي تاني بعد شوية.', false);
    return;
  }

  btn.disabled = true;
  showStatus('بنفتح نافذة فيسبوك... لو مفتحتش خلال ثواني، دوري على تبويب جديد فتح، أو شوفي لو فيه أيقونة "تم حظر نافذة منبثقة" جنب شريط العنوان.', true);

  // حماية: لو فيسبوك ماردّش خالص (رفض بصمت)، رجّعي الزرار شغال بعد 15 ثانية
  watchdogTimer = setTimeout(function () {
    resetButton();
    showStatus('مفيش رد من فيسبوك خلال 15 ثانية. جرّبي تاني، أو ابعتي هذه الرسالة لمن يتابع الإعداد معاكِ.', false);
  }, 15000);

  FB.login(function (response) {
    resetButton();
    if (response && response.authResponse) {
      showStatus('تم بنجاح! الكود: ' + response.authResponse.code, true);
    } else {
      showStatus('تم إلغاء العملية أو رفضت الموافقة.', false);
    }
  }, {
    config_id: '1630007755244155',
    response_type: 'code',
    override_default_response_type: true,
    extras: { setup: {}, featureType: '', sessionInfoVersion: '3' }
  });
}

document.addEventListener('DOMContentLoaded', function () {
  var btn = document.getElementById('loginBtn');
  if (btn) btn.addEventListener('click', launchSignup);
});
