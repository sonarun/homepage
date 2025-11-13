import { useTranslation } from "next-i18next";
import { FiHardDrive } from "react-icons/fi";

import Error from "../widget/error";
import Resource from "../widget/resource";
import Resources from "../widget/resources";
import WidgetLabel from "../widget/widget_label";

import useWidgetAPI from "utils/proxy/use-widget-api";

export default function Widget({ options }) {
  const { t } = useTranslation();

  // eslint-disable-next-line no-param-reassign, no-multi-assign
  options.service_group = options.service_name = "unifi_drive";
  const { data: storageData, error: storageError } = useWidgetAPI(options, "v2/storage", { index: options.index });

  if (storageError) {
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

  return (
    <Resources options={options} additionalClassNames="information-widget-unifi-drive">
      {storageData.pools.map((pool) => {
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
      {options.label && <WidgetLabel label={options.label} />}
    </Resources>
  );
}
