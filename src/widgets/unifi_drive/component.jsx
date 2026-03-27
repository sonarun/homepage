import Block from "components/services/widget/block";
import Container from "components/services/widget/container";
import { useTranslation } from "next-i18next";
import Share from "widgets/unifi_drive/share";

import useWidgetAPI from "utils/proxy/use-widget-api";

export default function Component({ service }) {
  const { t } = useTranslation();
  const { widget } = service;

  const { data: storageData, error: storageError } = useWidgetAPI(widget, "storage");
  const { data: sharesData, error: sharesError } = useWidgetAPI(widget, widget?.enableShares ? "shares" : "");

  if (storageError || sharesError) {
    return <Container service={service} error={storageError ?? sharesError} />;
  }

  if (!storageData || (widget?.enableShares && !sharesData)) {
    return (
      <Container service={service}>
        <Block field="unifi_drive.total" label="resources.total" />
        <Block field="unifi_drive.used" label="resources.used" />
        <Block field="unifi_drive.available" label="resources.free" />
        <Block field="unifi_drive.status" label="widget.status" />
      </Container>
    );
  }

  const { data: storage } = storageData;

  if (!storage) {
    return (
      <Container service={service}>
        <Block value={t("unifi_drive.no_data")} />
      </Container>
    );
  }

  const { totalQuota, usage, status } = storage;
  const totalBytes = totalQuota ?? 0;
  const usedBytes = (usage?.system || 0) + (usage?.myDrives || 0) + (usage?.sharedDrives || 0);
  const availableBytes = Math.max(0, totalBytes - usedBytes);
  const usagePercent = totalBytes > 0 ? ((usedBytes / totalBytes) * 100).toFixed(1) : 0;

  let statusValue = status;
  if (status === "healthy") statusValue = t("unifi_drive.healthy");
  else if (status === "degraded") statusValue = t("unifi_drive.degraded");

  const usedDisplay = widget?.showPercentage
    ? `${t("common.bytes", { value: usedBytes })} (${usagePercent}%)`
    : t("common.bytes", { value: usedBytes });

  let shares = [];
  const showShares = widget?.enableShares && Array.isArray(sharesData?.data) && sharesData.data.length > 0;
  if (showShares) {
    const source =
      widget?.shares?.length > 0 ? sharesData.data.filter((s) => widget.shares.includes(s.name)) : sharesData.data;
    shares = source.map((s) => ({ id: s.id, name: s.name, usage: s.usage, status: s.status, quota: s.quota }));
  }

  return (
    <>
      <Container service={service}>
        <Block field="unifi_drive.total" label="resources.total" value={t("common.bytes", { value: totalBytes })} />
        <Block field="unifi_drive.used" label="resources.used" value={usedDisplay} />
        <Block
          field="unifi_drive.available"
          label="resources.free"
          value={t("common.bytes", { value: availableBytes })}
        />
        <Block field="unifi_drive.status" label="widget.status" value={statusValue} />
      </Container>
      {showShares &&
        shares
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((share) => (
            <Share
              key={share.id}
              name={share.name}
              usage={share.usage}
              status={share.status}
              quota={share.quota}
              totalQuota={totalBytes}
              showPercentage={widget?.showPercentage}
              shareIcon={widget?.shareIcons?.[share.name] || widget?.shareIcon}
            />
          ))}
    </>
  );
}
