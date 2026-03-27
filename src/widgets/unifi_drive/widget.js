import unifiDriveProxyHandler from "./proxy";

const widget = {
  api: "{url}{prefix}/api/{endpoint}",
  proxyHandler: unifiDriveProxyHandler,

  mappings: {
    storage: {
      endpoint: "v1/systems/storage?type=detail",
    },
    shares: {
      endpoint: "v1/shared",
    },
  },
};

export default widget;
