import { getPrivateWidgetOptions } from "utils/config/widget-helpers";
import createLogger from "utils/logger";
import widgets from "widgets/widgets";

const logger = createLogger("unifiDriveWidgetAPI");

export default async function handler(req, res) {
  const { index } = req.query;

  try {
    const privateWidgetOptions = await getPrivateWidgetOptions("unifi_drive", index);

    if (!privateWidgetOptions) {
      logger.error("Unable to find widget options for unifi_drive index %s", index);
      return res.status(400).json({ error: "Invalid widget configuration" });
    }

    // Get the unifi_drive widget configuration
    const widget = widgets.unifi_drive;
    if (!widget || !widget.proxyHandler) {
      logger.error("UniFi Drive widget or proxy handler not found");
      return res.status(500).json({ error: "Widget configuration error" });
    }

    // Call the proxy handler with the v2/storage endpoint
    const proxyReq = {
      query: {
        group: "unifi_drive",
        service: "unifi_drive",
        endpoint: "v2/storage",
        index,
        query: JSON.stringify({ index: parseInt(index, 10) }),
      },
    };

    // Create a custom response object to capture the data
    let responseData;
    let responseStatus = 200;

    const proxyRes = {
      status: (code) => {
        responseStatus = code;
        return proxyRes;
      },
      json: (data) => {
        responseData = data;
        return proxyRes;
      },
      send: (data) => {
        responseData = data;
        return proxyRes;
      },
      setHeader: () => proxyRes,
    };

    // Call the proxy handler
    await widget.proxyHandler(proxyReq, proxyRes);

    // Return the data
    if (responseStatus !== 200) {
      return res.status(responseStatus).json(responseData || { error: "Proxy handler error" });
    }

    return res.status(200).send(responseData);
  } catch (e) {
    logger.error("Error in unifi_drive widget handler: %s", e.message);
    return res.status(500).json({ error: e.message });
  }
}
