function onClickHandler(heading_id) {
    if (!heading_id) {
        return;
    }

    var selector = '#' + heading_id + '-container';
    $(selector).toggle();
}
