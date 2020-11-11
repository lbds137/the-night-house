---
ordinal: 1
title: Roles
---

{% include atoms/heading.html size="2" text="Instructions" %}

{% capture intro_note %}
The roles that can be self-assigned have clickable **green buttons** which, when pressed, will copy the role assignment command to your system clipboard so that you can easily paste it in the channel.

These roles can be unassigned in the same manner by using the **red buttons** instead of the green ones.

**Please only paste and send one command at a time**. The bot does not know how to parse more than one command per message.

**The role categories below are collapsed by default; to expand them, click/tap on the heading name**. Each click toggles the display of the category (show/hide).
{% endcapture %}
{% include molecules/roles/note.html text=intro_note %}

{% include organisms/roles.html user="member" %}
