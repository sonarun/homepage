---
title: UniFi Drive
description: UniFi Drive Information Widget Configuration
---

_(Find the UniFi Drive service widget [here](../services/unifi-drive.md))_

The UniFi Drive information widget displays storage pool information from your UniFi Network Attached Storage (UNAS) device in a compact format at the top of your homepage. It is designed to match the style of other information widgets like Glances.

!!! warning
When authenticating you will want to use a local account that has at least read privileges.

!!! hint
If you enter e.g. incorrect credentials and receive an "API Error", you may need to recreate the container or restart the service to clear the cache.

```yaml
- unifi_drive:
    url: https://unifi.host.or.ip
    username: user
    password: pass
    label: UniFi Drive # optional
```

The widget will display:

- Hard drive icon for each storage pool
- Free space as the primary value
- Visual percentage bar showing usage
- Support for multiple storage pools (each displayed separately)

If no storage pools are available or the data is still loading, the widget will display a waiting state.
