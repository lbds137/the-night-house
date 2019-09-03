---
ordinal: 1
title: Roles
---

{% include atoms/heading.html size="2" text="Instructions" %}

{% capture intro_note %}
To gain access to the main part of the server, you will need to **leave a quick introduction** in the {% include atoms/roles/text.html text="!c!introduction!c!" %} channel. Your introduction **must** contain the following information, unless otherwise specified:
  * Preferred name and pronouns
  * Age **or** mention of whether you are **over** or **under** 18 years of age (minors **are** allowed in the server)
  * Confirmation that you have **read** the server rules and you **agree to abide** by them
  * Occult interests and/or path
  * Reason(s) for joining
  * How you found us
  * Anything else you'd like to tell us about yourself *(optional)*
Once you are admitted, you may use the {% include atoms/roles/text.html text="!c!role-request!c!" %} channel to (optionally) self-assign a number of roles, listed out below. Please note that some channels are only visible to members with certain roles.
{% endcapture %}
{% include molecules/roles/note.html text=intro_note %}

The roles that can be self-assigned have clickable **green buttons** which, when pressed, will copy the role assignment command to your system clipboard so that you can easily paste it in the channel. 

These roles can be unassigned in the same manner by using the **red buttons** instead of the green ones.

**Please only paste and send one command at a time**. The bot does not know how to parse more than one command per message.

**The role categories below are collapsed by default; to expand them, click/tap on the heading name**. Each click toggles the display of the category (show/hide).

{% include organisms/roles.html user="member" %}
