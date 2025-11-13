---
title: UniFi Drive
description: UniFi Drive Widget Configuration
---

Learn more about [UniFi Drive](https://ui.com/integrations/network-storage).

## Configuration

Displays storage statistics and optionally individual shared drives from your UniFi Network Attached Storage (UNAS) device.

```yaml
widget:
  type: unifi_drive
  url: https://unifi.host.or.ip
  username: your_username
  password: your_password
  fields: total, used, available, status # optional, which stats to display
  showPercentage: true # optional, show usage percentage (default: false)
  enableShares: true # optional, show individual shared drives
  shares: Photos, Videos # optional, filter which shares to display
  shareIcon: mdi-database # optional, default icon for all shares
  shareIcons: Photos:mdi-image,Videos:mdi-video # optional, per-share icons
```

Allowed fields: `["url", "username", "password", "fields", "showPercentage", "enableShares", "shares", "shareIcon", "shareIcons"]`

!!! warning
Requires a local UniFi account with at least read privileges.

!!! hint
If you receive an "API Error" with incorrect credentials, you may need to recreate the container or restart the service to clear the cache.

## Features

### Storage Statistics

Displays overall storage information with customizable fields:

**Available Fields** (all shown by default):

- `total` - Total storage capacity
- `used` - Used storage amount
- `available` - Free storage space
- `status` - Health status (Healthy/Degraded)

**Percentage Display:**

- Set `showPercentage: true` to show percentages alongside values
- Example: "732.51 GB (30.8%)" instead of "732.51 GB"
- Applies to both main storage statistics and individual shares

### Shared Drives

Set `enableShares: true` to display individual shared drives with:

- Share name and icon (colored green for active, red for inactive)
- Usage bar showing used/total capacity
- Quota-aware display (uses share quota if set, otherwise pool capacity)

**Filtering Shares:**
Use the `shares` parameter to display only specific shares (comma-separated, case-sensitive):

```yaml
shares: Photos, Videos, Documents
```

**Icon Customization:**
Icons support Material Design Icons (MDI), Simple Icons, Dashboard Icons, and direct URLs.

- **Global icon** (all shares): `shareIcon: mdi-database`
- **Per-share icons**: `shareIcons: Photos:mdi-image,Videos:mdi-video,Documents:mdi-file-document`

Popular MDI icons: `mdi-folder` (default), `mdi-database`, `mdi-server`, `mdi-harddisk`, `mdi-cloud`, `mdi-archive`

Browse all icons at [MDI Icon Library](https://pictogrammers.com/library/mdi/). Use Simple Icons with `si-` prefix.
