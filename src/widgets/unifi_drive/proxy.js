import cache from "memory-cache";

import getServiceWidget from "utils/config/service-helpers";
import { getPrivateWidgetOptions } from "utils/config/widget-helpers";
import createLogger from "utils/logger";
import { formatApiCall } from "utils/proxy/api-helpers";
import { addCookieToJar, setCookieHeader } from "utils/proxy/cookie-jar";
import { httpProxy } from "utils/proxy/http";
import widgets from "widgets/widgets";

const drivePrefix = "/proxy/drive";
const proxyName = "unifiDriveProxyHandler";
const prefixCacheKey = `${proxyName}__prefix`;
const logger = createLogger(proxyName);

async function getWidget(req) {
  const { group, service, index } = req.query;

  let widget = null;
  if (group === "unifi_drive" && service === "unifi_drive") {
    // component widget
    const widgetIndex = req.query?.query ? JSON.parse(req.query.query).index : undefined;
    logger.debug("Component widget request - widgetIndex: %s", widgetIndex);
    const widgetOptions = await getPrivateWidgetOptions("unifi_drive", widgetIndex);
    logger.debug("widgetOptions: %o", widgetOptions);
    if (!widgetOptions) {
      logger.debug("Error retrieving settings for this UniFi Drive widget");
      return null;
    }
    widget = { ...widgetOptions, type: "unifi_drive" };
    logger.debug("Final widget object: %o", widget);
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

async function login(widget, csrfToken) {
  const endpoint = "auth/login";
  const api = widgets?.[widget.type]?.api?.replace("{prefix}", ""); // no prefix for login url
  const loginUrl = new URL(formatApiCall(api, { endpoint, ...widget }));
  const loginBody = { username: widget.username, password: widget.password, remember: true, rememberMe: true };
  const headers = { "Content-Type": "application/json" };
  if (csrfToken) {
    headers["X-CSRF-TOKEN"] = csrfToken;
  }
  const [status, contentType, data, responseHeaders] = await httpProxy(loginUrl, {
    method: "POST",
    body: JSON.stringify(loginBody),
    headers,
  });
  return [status, contentType, data, responseHeaders];
}

export default async function unifiDriveProxyHandler(req, res) {
  const widget = await getWidget(req);
  const { service } = req.query;
  if (!widget) {
    return res.status(400).json({ error: "Invalid proxy service type" });
  }

  const api = widgets?.[widget.type]?.api;
  if (!api) {
    return res.status(403).json({ error: "Service does not support API calls" });
  }

  let [status, contentType, data, responseHeaders] = [];
  let prefix = cache.get(`${prefixCacheKey}.${service}`);
  let csrfToken;
  const headers = {};

  if (prefix === null) {
    // UniFi Drive uses /proxy/drive prefix on UniFi OS
    [status, contentType, data, responseHeaders] = await httpProxy(widget.url);
    prefix = drivePrefix;
    if (responseHeaders?.["x-csrf-token"]) {
      csrfToken = responseHeaders["x-csrf-token"];
    }
  }
  cache.put(`${prefixCacheKey}.${service}`, prefix);

  widget.prefix = prefix;
  const { endpoint } = req.query;
  const url = new URL(formatApiCall(api, { endpoint, ...widget }));
  const params = { method: "GET", headers };
  setCookieHeader(url, params);

  [status, contentType, data, responseHeaders] = await httpProxy(url, params);

  if (status === 401) {
    logger.debug("UniFi Drive isn't logged in or rejected the request, attempting login.");
    if (responseHeaders?.["x-csrf-token"]) {
      csrfToken = responseHeaders["x-csrf-token"];
    }
    [status, contentType, data, responseHeaders] = await login(widget, csrfToken);

    if (status !== 200) {
      logger.error("HTTP %d logging in to UniFi Drive. Data: %s", status, data);
      return res.status(status).json({ error: { message: `HTTP Error ${status}`, url, data } });
    }

    const json = JSON.parse(data.toString());
    if (!(json?.meta?.rc === "ok" || json?.login_time || json?.update_time)) {
      logger.error("Error logging in to UniFi Drive: Data: %s", data);
      return res.status(401).end(data);
    }

    addCookieToJar(url, responseHeaders);
    setCookieHeader(url, params);

    logger.debug("Retrying UniFi Drive request after login.");
    [status, contentType, data, responseHeaders] = await httpProxy(url, params);
  }

  if (status !== 200) {
    logger.error("HTTP %d getting data from UniFi Drive endpoint %s. Data: %s", status, url.href, data);
    return res.status(status).json({ error: { message: `HTTP Error ${status}`, url, data } });
  }

  if (contentType) res.setHeader("Content-Type", contentType);
  return res.status(status).send(data);
}
