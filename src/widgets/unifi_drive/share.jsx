import ResolvedIcon from "components/resolvedicon";
import { useTranslation } from "next-i18next";

export default function Share({ name, usage, status, quota, totalQuota, showPercentage, shareIcon = "mdi-folder" }) {
  const { t } = useTranslation();

  // Determine the limit: if quota is -1, use totalQuota (full pool), otherwise use quota in GB
  const limitBytes = quota === -1 ? totalQuota : quota * 1024 * 1024 * 1024; // Convert GB to bytes

  // Calculate percentage used
  const percentUsed = limitBytes > 0 ? (usage / limitBytes) * 100 : 0;

  // Calculate free space
  const freeBytes = limitBytes - usage;

  // Format values
  const usedFormatted = t("common.bytes", { value: usage });
  const totalFormatted = t("common.bytes", { value: limitBytes });

  // Determine status color: emerald (green) for active, rose (red) for inactive
  const statusColor = status === "active" ? "#10b981" : "#f43f5e"; // emerald-500 : rose-500

  // Append color to icon if it's an MDI or SI icon (supports color suffix)
  let coloredIcon = shareIcon;
  if (shareIcon && (shareIcon.startsWith("mdi-") || shareIcon.startsWith("si-"))) {
    coloredIcon = `${shareIcon}-${statusColor}`;
  }

  // Format display with or without percentage
  const displayText = showPercentage
    ? `${usedFormatted} / ${totalFormatted} (${percentUsed.toFixed(1)}%)`
    : `${usedFormatted} / ${totalFormatted}`;

  return (
    <div className="bg-theme-200/50 dark:bg-theme-900/20 rounded m-1 flex-1 flex flex-row items-center justify-between p-1">
      <div className="relative h-5 w-5 flex flex-row items-center">
        <ResolvedIcon icon={coloredIcon} width={20} height={20} />
      </div>
      <div className="text-theme-700 dark:text-theme-200 text-xs flex flex-col flex-1 ml-2">
        <div className="font-semibold">{name}</div>
        <div className="flex flex-col mt-0.5 min-w-[85px]">
          <div className="text-xs flex flex-row justify-between">
            <div className="pl-0.5">{displayText}</div>
          </div>
          <div className="mt-0.5 w-full bg-theme-800/30 rounded-full h-1 dark:bg-theme-200/20">
            <div
              className="bg-theme-800/70 h-1 rounded-full dark:bg-theme-200/50 transition-all duration-1000"
              style={{ width: `${Math.min(percentUsed, 100).toFixed(1)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
