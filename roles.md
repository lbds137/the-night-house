---
ordinal: 1
title: Roles
---

{% include atoms/heading.html size="2" text="Roles" %}

{%- capture role_assignment -%}!c!role-assignment!c!{%- endcapture -%}
{% capture intro_note %}
Listed below are the roles which are available in the server (with some limited exceptions, such as automatically managed bot integration roles). Some of these roles may be self-assigned via the {% include atoms/roles/text.html text=role_assignment %} channel, while others require staff intervention (such as the Adult and Nudist roles). 

For the roles that **can** be self assigned, the mechanism for self assignment entails clicking on an emoji reaction in the {% include atoms/roles/text.html text=role_assignment %} channel. 

To remove roles, simply remove the reaction you previously added. In some instances it may be necessary to toggle the emoji reaction until the role disappears from your role list (or, in the event that the YAGPDB.xyz bot is down, request staff assistance).

**The role categories below are collapsed by default; to expand them, click/tap on the heading name**. Each click toggles the display of the category (show/hide).
{% endcapture %}
{% include molecules/roles/note.html text=intro_note %}

{% include organisms/roles.html %}
