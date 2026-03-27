import { useTranslation } from "next-i18next";
import { FiFolder, FiHardDrive } from "react-icons/fi";

import Error from "../widget/error";
import Resource from "../widget/resource";
import Resources from "../widget/resources";
import WidgetLabel from "../widget/widget_label";

import useWidgetAPI from "utils/proxy/use-widget-api";

function parseFilter(value) {
  if (!value) return null;
  if (Array.isArray(value)) return value.length > 0 ? value : null;
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function Widget({ options }) {
  const { t } = useTranslation();

  // eslint-disable-next-line no-param-reassign, no-multi-assign
  options.service_group = options.service_name = "unifi_drive";

  const viewMode = options.view === "shares" ? "shares" : "pools";
  const { data: storageData, error: storageError } = useWidgetAPI(options, "pools", { index: options.index });
  const { data: sharesData, error: sharesError } = useWidgetAPI(options, viewMode === "shares" ? "shares" : "", {
    index: options.index,
  });

  const error = storageError || sharesError;
  if (error) {
    return <Error options={options} />;
  }

  if (!storageData || !storageData.pools || storageData.pools.length === 0) {
    return (
      <Resources options={options} additionalClassNames="information-widget-unifi-drive">
        <Resource icon={FiHardDrive} label={t("unifi_drive.wait")} percentage="0" />
        {options.label && <WidgetLabel label={options.label} />}
      </Resources>
    );
  }

  if (viewMode === "shares" && (!sharesData || !sharesData.data)) {
    return (
      <Resources options={options} additionalClassNames="information-widget-unifi-drive">
        <Resource icon={FiFolder} label={t("unifi_drive.wait")} percentage="0" />
        {options.label && <WidgetLabel label={options.label} />}
      </Resources>
    );
  }

  const totalCapacity = storageData.pools.reduce((sum, pool) => sum + (pool.capacity || 0), 0);
  const poolFilter = parseFilter(options.pools);
  const shareFilter = parseFilter(options.shares);

  return (
    <Resources options={options} additionalClassNames="information-widget-unifi-drive">
      {viewMode === "pools" &&
        storageData.pools
          .filter((pool) => !poolFilter || poolFilter.includes(pool.id))
          .map((pool) => {
            const usedBytes = pool.usage || 0;
            const totalBytes = pool.capacity || 0;
            const percentUsed = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;
            const freeBytes = totalBytes - usedBytes;

            return (
              <Resource
                key={pool.id}
                icon={FiHardDrive}
                value={t("common.bytes", { value: freeBytes, maximumFractionDigits: 1, binary: true })}
                label={t("unifi_drive.free")}
                expandedValue={t("common.bytes", { value: totalBytes, maximumFractionDigits: 1, binary: true })}
                expandedLabel={t("unifi_drive.total")}
                percentage={percentUsed}
              />
            );
          })}
      {viewMode === "shares" &&
        sharesData.data
          .filter((share) => !shareFilter || shareFilter.includes(share.name))
          .map((share) => {
            const limitBytes = share.quota === -1 ? totalCapacity : share.quota * 1024 * 1024 * 1024;
            const percentUsed = limitBytes > 0 ? (share.usage / limitBytes) * 100 : 0;

            return (
              <Resource
                key={share.id}
                icon={FiFolder}
                value={t("common.bytes", { value: share.usage, maximumFractionDigits: 1, binary: true })}
                label={share.name}
                expandedValue={t("common.bytes", { value: limitBytes, maximumFractionDigits: 1, binary: true })}
                expandedLabel={t("unifi_drive.total")}
                percentage={percentUsed}
              />
            );
          })}
      {options.label && <WidgetLabel label={options.label} />}
    </Resources>
  );
}
