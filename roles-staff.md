---
exclude: true
ordinal: 0
title: Roles (Staff)
---

{% include atoms/heading.html size="2" text="Instructions (Staff)" %}

{%- capture intro_note -%}
    This page is for {% include atoms/roles/text.html text="!r!499037360340598819!r!" %} members only. These commands are to be used in the {% include atoms/roles/text.html text="!c!role-request!c!" %} channel to assign roles to members, as needed. 
{%- endcapture -%}
{% include molecules/roles/note.html text=intro_note %}

The roles have clickable **green buttons** which, when pressed, will copy the role assignment command to your system clipboard so that you can easily paste it in the channel. **You will then need to replace `@user` with the actual user's Discord tag**. 

These roles can be unassigned in the same manner by using the **red buttons** instead of the green ones.

**Please only paste and send one command at a time**. The bot does not know how to parse more than one command per message.

**The role categories below are collapsed by default; to expand them, click/tap on the heading name**. Each click toggles the display of the category (show/hide).

{% include organisms/roles.html user="staff" %}
