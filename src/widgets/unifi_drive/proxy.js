import getServiceWidget from "utils/config/service-helpers";
import { getPrivateWidgetOptions } from "utils/config/widget-helpers";
import createUnifiProxyHandler from "utils/proxy/handlers/unifi";
import { httpProxy } from "utils/proxy/http";

const drivePrefix = "/proxy/drive";

async function getWidget(req, logger) {
  const { group, service, index } = req.query;

  let widget = null;
  if (group === "unifi_drive" && service === "unifi_drive") {
    // info widget
    const infowidgetIndex = req.query?.query ? JSON.parse(req.query.query).index : undefined;
    widget = await getPrivateWidgetOptions("unifi_drive", infowidgetIndex);
    if (!widget) {
      logger.debug("Error retrieving settings for this UniFi Drive widget");
      return null;
    }
    widget.type = "unifi_drive";
  } else {
    if (!group || !service) {
      logger.debug("Invalid or missing service '%s' or group '%s'", service, group);
      return null;
    }

    widget = await getServiceWidget(group, service, index);

    if (!widget) {
      logger.debug("Invalid or missing widget for service '%s' in group '%s'", service, group);
      return null;
    }
  }

  return widget;
}

async function resolveRequestContext({ cachedPrefix, widget }) {
  if (cachedPrefix !== null) {
    return { prefix: cachedPrefix };
  }

  const [, , , responseHeaders] = await httpProxy(widget.url);

  return {
    prefix: drivePrefix,
    csrfToken: responseHeaders?.["x-csrf-token"],
  };
}

export default createUnifiProxyHandler({
  proxyName: "unifiDriveProxyHandler",
  resolveWidget: getWidget,
  resolveRequestContext,
});
