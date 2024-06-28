document.getElementById('talkgroup-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const tgid = encodeURIComponent(document.getElementById('talkgroup').value);
    fetch(`/tune/${tgid}`).then(response => response.text()).then(data => alert(data));
});

function updateTalkgroups() {
    const mode = document.getElementById('mode').value;
    fetch(`/mode/${mode}`)
        .then(response => response.json())
        .then(talkgroups => {
            const talkgroupSelect = document.getElementById('talkgroup');
            talkgroupSelect.innerHTML = '';
            talkgroups.forEach(tg => {
                const option = document.createElement('option');
                option.value = tg.tgid;
                option.textContent = `${tg.alias} (${tg.tgid})`;
                talkgroupSelect.appendChild(option);
            });
        });
}

document.addEventListener('DOMContentLoaded', function() {
    //updateTalkgroups(); // Dont do for now, come back later and revisit
});