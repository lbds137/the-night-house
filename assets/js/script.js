// enable the ClipboardJS plugin to bind events to buttons
new ClipboardJS('.a-btn');

function onClickHandler(heading_id) {
    if (!heading_id) {
        return;
    }

    var selector = '#' + heading_id + '-container';
    $(selector).toggle();
}