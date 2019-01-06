---
ordinal: 1
title: Roles
---

{% include atoms/heading.html size="2" text="Instructions" %}

{%- capture intro_note -%}
    To gain access to the main part of the server, you will need to **leave a quick introduction** in the {% include atoms/roles/text.html text="!c!introduction!c!" %} channel and then request the {% include atoms/roles/text.html text="!r!497610586750976020!r!" %} role from a {% include atoms/roles/text.html text="!r!499037360340598819!r!" %} member in the {% include atoms/roles/text.html text="!c!role-request!c!" %} channel. In the latter channel you may also optionally self-assign a number of roles, listed out below. 
{%- endcapture -%}
{% include molecules/roles/note.html text=intro_note %}

The roles that can be self-assigned have clickable **green buttons** which, when pressed, will copy the role assignment command to your system clipboard so that you can easily paste it in the channel. 

These roles can be unassigned in the same manner by using the **red buttons** instead of the green ones.

**Please only paste and send one command at a time**. The bot does not know how to parse more than one command per message.

{% include organisms/roles.html %}
