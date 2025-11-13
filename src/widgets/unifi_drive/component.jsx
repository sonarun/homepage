import Block from "components/services/widget/block";
import Container from "components/services/widget/container";
import { useTranslation } from "next-i18next";
import Share from "widgets/unifi_drive/share";

import useWidgetAPI from "utils/proxy/use-widget-api";

export default function Component({ service }) {
  const { t } = useTranslation();

  const { widget } = service;

  const { data: storageData, error: storageError } = useWidgetAPI(widget, "v1/systems/storage?type=detail");
  const { data: sharesData, error: sharesError } = useWidgetAPI(widget, widget?.enableShares ? "v1/shared" : "");

  if (storageError || sharesError) {
    const finalError = storageError ?? sharesError;
    return <Container service={service} error={finalError} />;
  }

  if (!storageData || (widget?.enableShares && !sharesData)) {
    return (
      <Container service={service}>
        <Block label="unifi_drive.total" />
        <Block label="unifi_drive.used" />
        <Block label="unifi_drive.available" />
        <Block label="unifi_drive.status" />
      </Container>
    );
  }

  // Extract data from the API response
  const { data: storage } = storageData;

  if (!storage) {
    return (
      <Container service={service}>
        <Block value={t("unifi_drive.no_data")} />
      </Container>
    );
  }

  const { totalQuota, usage, status } = storage;

  // Calculate used storage (system + myDrives + sharedDrives)
  const usedBytes = (usage?.system || 0) + (usage?.myDrives || 0) + (usage?.sharedDrives || 0);

  // Calculate available storage
  const availableBytes = totalQuota - usedBytes;

  // Calculate usage percentage
  const usagePercent = totalQuota > 0 ? ((usedBytes / totalQuota) * 100).toFixed(1) : 0;

  // Format storage values using common.bytes translation
  const total = totalQuota > 0 ? t("common.bytes", { value: totalQuota }) : t("common.na");
  const used = t("common.bytes", { value: usedBytes });
  const available = t("common.bytes", { value: availableBytes });

  // Format status
  const statusValue = status === "healthy" ? t("unifi_drive.healthy") : t("unifi_drive.degraded");

  // Determine which fields to display (default to all if not specified)
  const defaultFields = ["total", "used", "available", "status"];
  const displayFields = widget?.fields || defaultFields;

  // Process shares data
  let shares = [];
  const showShares = widget?.enableShares && Array.isArray(sharesData?.data) && sharesData.data.length > 0;

  if (showShares) {
    // Map share data
    let allShares = sharesData.data.map((share) => ({
      id: share.id,
      name: share.name,
      usage: share.usage,
      status: share.status,
      quota: share.quota,
    }));

    // Filter shares if a specific list is configured
    if (widget?.shares && Array.isArray(widget.shares) && widget.shares.length > 0) {
      shares = allShares.filter((share) => widget.shares.includes(share.name));
    } else {
      shares = allShares;
    }
  }

  // Determine used value format (with or without percentage)
  const usedValue = widget?.showPercentage ? `${used} (${usagePercent}%)` : used;

  return (
    <>
      <Container service={service}>
        {displayFields.includes("total") && <Block label="unifi_drive.total" value={total} />}
        {displayFields.includes("used") && <Block label="unifi_drive.used" value={usedValue} />}
        {displayFields.includes("available") && <Block label="unifi_drive.available" value={available} />}
        {displayFields.includes("status") && <Block label="unifi_drive.status" value={statusValue} />}
      </Container>
      {showShares &&
        shares
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((share) => {
            // Determine icon: per-share icon takes precedence over global shareIcon
            const icon = widget?.shareIcons?.[share.name] || widget?.shareIcon;
            return (
              <Share
                key={share.id}
                name={share.name}
                usage={share.usage}
                status={share.status}
                quota={share.quota}
                totalQuota={totalQuota}
                showPercentage={widget?.showPercentage}
                shareIcon={icon}
              />
            );
          })}
    </>
  );
}
