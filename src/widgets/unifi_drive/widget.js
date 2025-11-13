import unifiDriveProxyHandler from "./proxy";

const widget = {
  api: "{url}{prefix}/api/{endpoint}",
  proxyHandler: unifiDriveProxyHandler,

  mappings: {
    "v1/systems/storage?type=detail": {
      endpoint: "v1/systems/storage?type=detail",
    },
    "v1/shared": {
      endpoint: "v1/shared",
    },
    "v2/storage": {
      endpoint: "v2/storage",
    },
  },
};

export default widget;
