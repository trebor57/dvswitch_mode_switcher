document.getElementById('talkgroup-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const tgid = document.getElementById('talkgroup').value;
    fetch(`/tune/${tgid}`).then(response => response.text()).then(data => alert(data));
});

document.getElementById('mode-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const mode = document.getElementById('mode').value;
    fetch(`/mode/${mode}`).then(response => response.text()).then(data => alert(data));
});